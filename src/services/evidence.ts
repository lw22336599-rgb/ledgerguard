import { createHash } from "node:crypto";
import {
  decodeEventLog,
  getAddress,
  isAddressEqual,
  parseAbiItem,
  type Address,
  type Hex,
  type Log,
  type Transaction,
  type TransactionReceipt,
} from "viem";
import type { EvidenceInput } from "../schemas.js";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export interface NormalizedTransfer {
  assetAddress: Address;
  from: Address;
  to: Address;
  amount: string;
  logIndex: number;
}

export interface EvidenceResult {
  status: "VERIFIED" | "MISMATCH" | "REVERTED" | "REVIEW";
  network: string;
  txHash: Hex;
  blockNumber: string;
  transactionTo: Address | null;
  nativeValueMicroUsdc: string | null;
  transfers: NormalizedTransfer[];
  findings: Array<{
    code: string;
    severity: "warning" | "critical";
    message: string;
  }>;
  evidenceHash: Hex;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );
    return `{${entries
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sameAddress(left: string, right: string): boolean {
  return isAddressEqual(getAddress(left), getAddress(right));
}

export function extractTransfers(logs: readonly Log[]): NormalizedTransfer[] {
  const transfers: NormalizedTransfer[] = [];

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics,
        strict: true,
      });
      if (decoded.eventName !== "Transfer") continue;
      const { from, to, value } = decoded.args;
      transfers.push({
        assetAddress: getAddress(log.address),
        from: getAddress(from),
        to: getAddress(to),
        amount: value.toString(),
        logIndex: Number(log.logIndex ?? 0),
      });
    } catch {
      // Non-transfer logs are intentionally ignored.
    }
  }

  return transfers;
}

export function buildEvidence(
  input: EvidenceInput,
  transaction: Transaction,
  receipt: TransactionReceipt,
): EvidenceResult {
  const transfers = extractTransfers(receipt.logs);
  const findings: EvidenceResult["findings"] = [];
  const nativeValue =
    typeof transaction.value === "bigint" ? transaction.value : 0n;
  const nativeValueMicroUsdc =
    nativeValue > 0n && nativeValue % 1_000_000_000_000n === 0n
      ? (nativeValue / 1_000_000_000_000n).toString()
      : null;

  if (receipt.status !== "success") {
    findings.push({
      code: "TRANSACTION_REVERTED",
      severity: "critical",
      message: "The transaction reverted onchain.",
    });
  }

  const matchingTransfer = transfers.find((transfer) => {
    const recipientMatches =
      !input.intent.expectedRecipient ||
      sameAddress(transfer.to, input.intent.expectedRecipient);
    const assetMatches =
      !input.intent.expectedAssetAddress ||
      sameAddress(transfer.assetAddress, input.intent.expectedAssetAddress);
    const amountMatches =
      !input.intent.expectedAmountMicroUsdc ||
      transfer.amount === input.intent.expectedAmountMicroUsdc;
    return recipientMatches && assetMatches && amountMatches;
  });

  const matchingNativeTransfer =
    input.intent.action === "transfer" &&
    transaction.to !== null &&
    nativeValueMicroUsdc !== null &&
    (!input.intent.expectedRecipient ||
      sameAddress(transaction.to, input.intent.expectedRecipient)) &&
    (!input.intent.expectedAssetAddress ||
      sameAddress(
        input.intent.expectedAssetAddress,
        "0x3600000000000000000000000000000000000000",
      )) &&
    (!input.intent.expectedAmountMicroUsdc ||
      nativeValueMicroUsdc === input.intent.expectedAmountMicroUsdc);

  if (
    input.intent.action === "transfer" &&
    !matchingTransfer &&
    !matchingNativeTransfer
  ) {
    findings.push({
      code: "EXPECTED_TRANSFER_NOT_FOUND",
      severity: "critical",
      message: "No transfer event matched the declared recipient, asset, and amount.",
    });
  }

  if (input.intent.action === "contract_call" && transfers.length === 0) {
    findings.push({
      code: "NO_VALUE_MOVEMENT_OBSERVED",
      severity: "warning",
      message: "The call finalized but no ERC-20 Transfer event was observed.",
    });
  }

  const status: EvidenceResult["status"] =
    receipt.status !== "success"
      ? "REVERTED"
      : findings.some((item) => item.severity === "critical")
        ? "MISMATCH"
        : findings.some((item) => item.severity === "warning")
          ? "REVIEW"
          : "VERIFIED";

  const evidenceBody = {
    status,
    network: input.network,
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber.toString(),
    transactionTo: transaction.to,
    nativeValueMicroUsdc,
    transfers,
    intent: input.intent,
  };
  const evidenceHash = `0x${createHash("sha256")
    .update(stableStringify(evidenceBody))
    .digest("hex")}` as Hex;

  return {
    status,
    network: input.network,
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber.toString(),
    transactionTo: transaction.to,
    nativeValueMicroUsdc,
    transfers,
    findings,
    evidenceHash,
  };
}
