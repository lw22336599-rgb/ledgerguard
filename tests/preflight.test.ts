import { encodeFunctionData, maxUint256, parseAbi } from "viem";
import { describe, expect, it } from "vitest";
import { ARC_TESTNET_USDC } from "../src/config/networks.js";
import { preflightSchema } from "../src/schemas.js";
import { evaluatePreflight } from "../src/services/preflight.js";

const abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

const sender = "0x1111111111111111111111111111111111111111";
const recipient = "0x2222222222222222222222222222222222222222";

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
