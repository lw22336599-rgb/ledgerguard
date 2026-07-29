import {
  encodeEventTopics,
  encodeAbiParameters,
  getAddress,
  parseAbiItem,
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
const from = "0x1111111111111111111111111111111111111111";
const to = "0x2222222222222222222222222222222222222222";
const txHash = `0x${"a".repeat(64)}` as const;

function fixture() {
  const topics = encodeEventTopics({
    abi: [transferEvent],
    eventName: "Transfer",
    args: { from, to },
  });
  const log = {
    address: ARC_TESTNET_USDC,
    topics,
    data: encodeAbiParameters([{ type: "uint256" }], [1_000_000n]),
    logIndex: 0,
    blockHash: `0x${"b".repeat(64)}`,
    blockNumber: 123n,
    transactionHash: txHash,
    transactionIndex: 0,
    removed: false,
  } as unknown as Log;
  const transaction = {
    hash: txHash,
    to: getAddress(ARC_TESTNET_USDC),
  } as Transaction;
  const receipt = {
    transactionHash: txHash,
    blockNumber: 123n,
    status: "success",
    logs: [log],
  } as TransactionReceipt;
  return { transaction, receipt };
}

describe("evidence", () => {
  it("verifies a matching transfer and produces a deterministic hash", () => {
    const input = evidenceSchema.parse({
      txHash,
      intent: {
        action: "transfer",
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
        expectedRecipient: to,
        expectedAssetAddress: ARC_TESTNET_USDC,
        expectedAmountMicroUsdc: "1500000",
        purpose: "Native USDC payment",
      },
    });
    const { receipt } = fixture();
    const transaction = {
      hash: txHash,
      to: getAddress(to),
      value: 1_500_000_000_000_000_000n,
    } as Transaction;
    const nativeReceipt = { ...receipt, logs: [] } as TransactionReceipt;
    const result = buildEvidence(input, transaction, nativeReceipt);

    expect(result.status).toBe("VERIFIED");
    expect(result.nativeValueMicroUsdc).toBe("1500000");
    expect(result.transfers).toHaveLength(0);
  });
});
