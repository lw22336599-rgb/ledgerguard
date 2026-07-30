import {
  encodeEventTopics,
  encodeAbiParameters,
  getAddress,
  parseAbiItem,
  type Address,
  type Log,
  type Transaction,
  type TransactionReceipt,
} from "viem";
import { describe, expect, it } from "vitest";
import { ARC_TESTNET_USDC } from "../src/config/networks.js";
import { evidenceSchema } from "../src/schemas.js";
import { buildEvidence } from "../src/services/evidence.js";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);
const approvalEvent = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
);
const from = "0x1111111111111111111111111111111111111111";
const to = "0x2222222222222222222222222222222222222222";
const other = "0x3333333333333333333333333333333333333333";
const txHash = `0x${"a".repeat(64)}` as const;

function transferLog(
  source: Address = from,
  recipient: Address = to,
  amount = 1_000_000n,
  logIndex = 0,
): Log {
  const topics = encodeEventTopics({
    abi: [transferEvent],
    eventName: "Transfer",
    args: { from: source, to: recipient },
  });
  return {
    address: ARC_TESTNET_USDC,
    topics,
    data: encodeAbiParameters([{ type: "uint256" }], [amount]),
    logIndex,
    blockHash: `0x${"b".repeat(64)}`,
    blockNumber: 123n,
    transactionHash: txHash,
    transactionIndex: 0,
    removed: false,
  } as unknown as Log;
}

function approvalLog(logIndex = 1): Log {
  const topics = encodeEventTopics({
    abi: [approvalEvent],
    eventName: "Approval",
    args: { owner: from, spender: other },
  });
  return {
    address: ARC_TESTNET_USDC,
    topics,
    data: encodeAbiParameters([{ type: "uint256" }], [1_000_000n]),
    logIndex,
    blockHash: `0x${"b".repeat(64)}`,
    blockNumber: 123n,
    transactionHash: txHash,
    transactionIndex: 0,
    removed: false,
  } as unknown as Log;
}

function fixture(logs: Log[] = [transferLog()]) {
  const transaction = {
    hash: txHash,
    from: getAddress(from),
    to: getAddress(ARC_TESTNET_USDC),
  } as Transaction;
  const receipt = {
    transactionHash: txHash,
    blockNumber: 123n,
    status: "success",
    logs,
  } as TransactionReceipt;
  return { transaction, receipt };
}

describe("evidence", () => {
  it("verifies a matching transfer and produces a deterministic hash", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Invoice 42",
      },
    });
    const { transaction, receipt } = fixture();
    const first = buildEvidence(input, transaction, receipt);
    const second = buildEvidence(input, transaction, receipt);

    expect(first.status).toBe("VERIFIED");
    expect(first.transfers).toHaveLength(1);
    expect(first.evidenceHash).toBe(second.evidenceHash);
  });

  it("flags an amount mismatch", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "2000000",
        purpose: "Wrong amount",
      },
    });
    const { transaction, receipt } = fixture();
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("MISMATCH");
    expect(result.findings[0]?.code).toBe("EXPECTED_TRANSFER_NOT_FOUND");
  });

  it("verifies Arc native USDC value without double-counting it as another asset", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1500000",
        purpose: "Native USDC payment",
      },
    });
    const { receipt } = fixture();
    const transaction = {
      hash: txHash,
      from: getAddress(from),
      to: getAddress(to),
      value: 1_500_000_000_000_000_000n,
    } as Transaction;
    const nativeReceipt = { ...receipt, logs: [] } as TransactionReceipt;
    const result = buildEvidence(input, transaction, nativeReceipt, false);

    expect(result.status).toBe("VERIFIED");
    expect(result.nativeValueMicroUsdc).toBe("1500000");
    expect(result.transfers).toHaveLength(0);
  });

  it("does not strictly verify native USDC sent to a contract", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1500000",
        purpose: "Contract payment needs contract-specific evidence",
      },
    });
    const { receipt } = fixture();
    const transaction = {
      hash: txHash,
      from: getAddress(from),
      to: getAddress(to),
      value: 1_500_000_000_000_000_000n,
    } as Transaction;
    const nativeReceipt = { ...receipt, logs: [] } as TransactionReceipt;
    const result = buildEvidence(input, transaction, nativeReceipt, true);

    expect(result.status).toBe("REVIEW");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "NATIVE_CONTRACT_EFFECTS_UNVERIFIED",
    );
  });

  it("does not verify an approval intent without matching approval evidence", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "approve",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Approval evidence must exist",
      },
    });
    const { transaction, receipt } = fixture();
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("MISMATCH");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "EXPECTED_APPROVAL_NOT_FOUND",
    );
  });

  it("does not verify a transfer from the wrong payer", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Bind evidence to the intended payer",
      },
    });
    const { transaction, receipt } = fixture([transferLog(other)]);
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("MISMATCH");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "EXPECTED_TRANSFER_NOT_FOUND",
    );
  });

  it("ignores Arc native USDC mirror logs when an ERC-20 transfer matches", () => {
    const mirrorAddress =
      "0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE" as Address;
    const input = evidenceSchema.parse({
      network: "arcTestnet",
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Arc ERC-20 with native mirror",
      },
    });
    const { transaction, receipt } = fixture([
      {
        ...transferLog(from, to, 1_000_000_000_000_000_000n, 0),
        address: mirrorAddress,
      } as Log,
      transferLog(),
    ]);
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("VERIFIED");
    expect(result.transfers).toHaveLength(2);
    expect(result.findings.map((finding) => finding.code)).not.toContain(
      "UNEXPECTED_TRANSFER",
    );
  });

  it("does not verify a matching transfer when extra transfers or approvals exist", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Reject hidden side effects",
      },
    });
    const { transaction, receipt } = fixture([
      transferLog(),
      transferLog(from, other, 25n, 1),
      approvalLog(2),
    ]);
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("MISMATCH");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "UNEXPECTED_TRANSFER",
    );
    expect(result.findings.map((finding) => finding.code)).toContain(
      "UNEXPECTED_APPROVAL",
    );
  });

  it("does not verify a zero-value payment event", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "0",
        purpose: "Zero is not a completed payment",
      },
    });
    const { transaction, receipt } = fixture([transferLog(from, to, 0n)]);
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("MISMATCH");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "ZERO_TRANSFER_AMOUNT",
    );
  });

  it("does not verify an ERC-20 payment with extra native value", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Reject hidden native value",
      },
    });
    const { transaction: baseTransaction, receipt } = fixture();
    const transaction = {
      ...baseTransaction,
      value: 1_000_000_000_000n,
    } as Transaction;
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("MISMATCH");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "UNEXPECTED_NATIVE_VALUE",
    );
  });

  it("rejects duplicate matching events even if their log indexes collide", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: from,
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1000000",
        purpose: "Exactly one payment event is expected",
      },
    });
    const { transaction, receipt } = fixture([
      transferLog(),
      transferLog(),
    ]);
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("MISMATCH");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "UNEXPECTED_TRANSFER",
    );
  });

  it("never marks an unknown contract call as strictly verified", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "contract_call",
        purpose: "Unknown calls require review",
      },
    });
    const { transaction, receipt } = fixture();
    const result = buildEvidence(input, transaction, receipt);

    expect(result.status).toBe("REVIEW");
    expect(result.findings.map((finding) => finding.code)).toContain(
      "UNVERIFIED_CONTRACT_CALL",
    );
  });
});
