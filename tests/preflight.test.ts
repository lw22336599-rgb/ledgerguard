import { encodeFunctionData, maxUint256, parseAbi } from "viem";
import { describe, expect, it } from "vitest";
import { ARC_TESTNET_USDC } from "../src/config/networks.js";
import { preflightSchema } from "../src/schemas.js";
import { evaluatePreflight } from "../src/services/preflight.js";

const abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
]);

const sender = "0x1111111111111111111111111111111111111111";
const recipient = "0x2222222222222222222222222222222222222222";
const debitSource = "0x3333333333333333333333333333333333333333";

describe("preflight", () => {
  it("allows a matching simulated USDC transfer", () => {
    const data = preflightSchema.parse({
      network: "arcTestnet",
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "transfer",
        args: [recipient, 1_000_000n],
      }),
      intent: {
        action: "transfer",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Test payment",
      },
      policy: {
        allowedTargets: [ARC_TESTNET_USDC],
        maxAmountMicroUsdc: "2000000",
      },
    });

    const result = evaluatePreflight(data, { status: "success" });
    expect(result.decision).toBe("ALLOW");
    expect(result.decoded.kind).toBe("erc20_transfer");
  });

  it("blocks a recipient mismatch", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "transfer",
        args: [recipient, 1_000_000n],
      }),
      intent: {
        action: "transfer",
        expectedRecipient: sender,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Test mismatch",
      },
      policy: {},
    });

    const result = evaluatePreflight(data, { status: "success" });
    expect(result.decision).toBe("BLOCK");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "RECIPIENT_MISMATCH",
    );
  });

  it("blocks transferFrom when the decoded debit source differs from intent", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "transferFrom",
        args: [debitSource, recipient, 1_000_000n],
      }),
      intent: {
        action: "transfer",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Do not debit an undeclared wallet",
      },
      policy: {},
    });

    const result = evaluatePreflight(data, { status: "success" });
    expect(result.decision).toBe("BLOCK");
    expect(result.decoded.debitAddress).toBe(debitSource);
    expect(result.findings.map((finding) => finding.code)).toContain(
      "DEBIT_ADDRESS_MISMATCH",
    );
  });

  it("blocks transferFrom when no expected debit source is declared", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "transferFrom",
        args: [debitSource, recipient, 1_000_000n],
      }),
      intent: {
        action: "transfer",
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Unknown debit source",
      },
      policy: {},
    });

    const result = evaluatePreflight(data, { status: "success" });
    expect(result.decision).toBe("BLOCK");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "DEBIT_ADDRESS_REQUIRED",
    );
  });

  it("blocks a zero-value transfer but continues to allow approve zero", () => {
    const transferInput = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "transfer",
        args: [recipient, 0n],
      }),
      intent: {
        action: "transfer",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "0",
        purpose: "Zero payment must not pass",
      },
      policy: {},
    });
    const approvalInput = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "approve",
        args: [recipient, 0n],
      }),
      intent: {
        action: "approve",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "0",
        purpose: "Revoke an approval",
      },
      policy: {},
    });

    const transferResult = evaluatePreflight(transferInput, { status: "success" });
    const approvalResult = evaluatePreflight(approvalInput, { status: "success" });

    expect(transferResult.decision).toBe("BLOCK");
    expect(transferResult.findings.map((finding) => finding.code)).toContain(
      "ZERO_TRANSFER_AMOUNT",
    );
    expect(approvalResult.decision).toBe("ALLOW");
  });

  it("blocks an unlimited approval by default", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "approve",
        args: [recipient, maxUint256],
      }),
      intent: {
        action: "approve",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: maxUint256.toString(),
        purpose: "Test approval",
      },
      policy: {},
    });

    const result = evaluatePreflight(data, { status: "success" });
    expect(result.decision).toBe("BLOCK");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "UNLIMITED_APPROVAL",
    );
  });

  it("allows an exact finite USDC approval after successful simulation", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "approve",
        args: [recipient, 1_000_000n],
      }),
      intent: {
        action: "approve",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Exact approval",
      },
      policy: {
        maxAmountMicroUsdc: "1000000",
      },
    });

    const result = evaluatePreflight(data, { status: "success" });
    expect(result.decision).toBe("ALLOW");
  });

  it("keeps a payment in review when the payer is not declared", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "transfer",
        args: [recipient, 1_000_000n],
      }),
      intent: {
        action: "transfer",
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Payer binding is required for ALLOW",
      },
      policy: {},
    });

    const result = evaluatePreflight(data, { status: "success" });
    expect(result.decision).toBe("REVIEW");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "DEBIT_ADDRESS_NOT_DECLARED",
    );
  });

  it("allows an exact native Arc USDC transfer with no decimal remainder", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: recipient,
      data: "0x",
      valueWei: "1500000000000000000",
      intent: {
        action: "transfer",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1500000",
        purpose: "Native Arc USDC payment",
      },
      policy: { maxAmountMicroUsdc: "2000000" },
    });

    const result = evaluatePreflight(data, {
      status: "success",
      targetHasCode: false,
    });
    expect(result.decision).toBe("ALLOW");
    expect(result.decoded.kind).toBe("native_usdc_transfer");
    expect(result.decoded.assetAddress).toBe(ARC_TESTNET_USDC);
  });

  it("keeps a native payment to a contract in review", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: recipient,
      data: "0x",
      valueWei: "1000000000000000000",
      intent: {
        action: "transfer",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Contract recipient requires deeper review",
      },
      policy: {},
    });

    const result = evaluatePreflight(data, {
      status: "success",
      targetHasCode: true,
    });
    expect(result.decision).toBe("REVIEW");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "NATIVE_CONTRACT_RECIPIENT",
    );
  });

  it("blocks hidden native value attached to a token transfer", () => {
    const data = preflightSchema.parse({
      from: sender,
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "transfer",
        args: [recipient, 1_000_000n],
      }),
      valueWei: "1000000000000000000",
      intent: {
        action: "transfer",
        expectedDebitAddress: sender,
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Reject hidden native side payment",
      },
      policy: {},
    });

    const result = evaluatePreflight(data, { status: "success" });
    expect(result.decision).toBe("BLOCK");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "UNEXPECTED_NATIVE_VALUE",
    );
  });

  it("blocks when required simulation was not run", () => {
    const data = preflightSchema.parse({
      to: ARC_TESTNET_USDC,
      data: encodeFunctionData({
        abi,
        functionName: "transfer",
        args: [recipient, 1_000_000n],
      }),
      intent: {
        action: "transfer",
        expectedRecipient: recipient,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Simulation is a signing gate",
      },
      policy: {},
    });

    const result = evaluatePreflight(data, { status: "not_run" });
    expect(result.decision).toBe("BLOCK");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "SIMULATION_REQUIRED",
    );
  });

  it("keeps Arc mainnet disabled", () => {
    const data = preflightSchema.parse({
      network: "arcMainnet",
      to: recipient,
      intent: {
        action: "contract_call",
        purpose: "Should never activate guessed mainnet",
      },
      policy: {},
    });

    expect(data.network).toBe("arcMainnet");
  });
});
