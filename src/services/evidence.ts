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
import { ARC_TESTNET_USDC } from "../config/networks.js";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);
const approvalEvent = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
);
const approvalForAllEvent = parseAbiItem(
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
);

export interface NormalizedTransfer {
  assetAddress: Address;
  from: Address;
  to: Address;
  amount: string;
  logIndex: number;
}

export interface NormalizedApproval {
  assetAddress: Address;
  owner: Address;
  spender: Address;
  amount: string;
  logIndex: number;
  kind: "erc20_approval" | "operator_approval";
}

export interface EvidenceResult {
  status: "VERIFIED" | "MISMATCH" | "REVERTED" | "REVIEW";
  network: string;
  txHash: Hex;
  blockNumber: string;
  transactionTo: Address | null;
  nativeValueMicroUsdc: string | null;
  transfers: NormalizedTransfer[];
  approvals: NormalizedApproval[];
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

export function extractApprovals(logs: readonly Log[]): NormalizedApproval[] {
  const approvals: NormalizedApproval[] = [];

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: [approvalEvent],
        data: log.data,
        topics: log.topics,
        strict: true,
      });
      if (decoded.eventName === "Approval") {
        const { owner, spender, value } = decoded.args;
        approvals.push({
          assetAddress: getAddress(log.address),
          owner: getAddress(owner),
          spender: getAddress(spender),
          amount: value.toString(),
          logIndex: Number(log.logIndex ?? 0),
          kind: "erc20_approval",
        });
        continue;
      }
    } catch {
      // Try ApprovalForAll below.
    }

    try {
      const decoded = decodeEventLog({
        abi: [approvalForAllEvent],
        data: log.data,
        topics: log.topics,
        strict: true,
      });
      if (decoded.eventName === "ApprovalForAll") {
        const { owner, operator, approved } = decoded.args;
        approvals.push({
          assetAddress: getAddress(log.address),
          owner: getAddress(owner),
          spender: getAddress(operator),
          amount: approved ? "unlimited" : "0",
          logIndex: Number(log.logIndex ?? 0),
          kind: "operator_approval",
        });
      }
    } catch {
      // Non-approval logs are intentionally ignored.
    }
  }

  return approvals;
}

export function buildEvidence(
  input: EvidenceInput,
  transaction: Transaction,
  receipt: TransactionReceipt,
): EvidenceResult {
  const transfers = extractTransfers(receipt.logs);
  const approvals = extractApprovals(receipt.logs);
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

  if (
    input.network === "arcTestnet" &&
    input.intent.expectedAssetAddress &&
    !sameAddress(input.intent.expectedAssetAddress, ARC_TESTNET_USDC)
  ) {
    findings.push({
      code: "NON_USDC_ASSET",
      severity: "critical",
      message: "The declared asset is not the official Arc Testnet USDC asset.",
    });
  }

  const matchingTransfers = transfers.filter((transfer) => {
    const payerMatches =
      !input.intent.expectedDebitAddress ||
      sameAddress(transfer.from, input.intent.expectedDebitAddress);
    const recipientMatches =
      !input.intent.expectedRecipient ||
      sameAddress(transfer.to, input.intent.expectedRecipient);
    const assetMatches =
      !input.intent.expectedAssetAddress ||
      sameAddress(transfer.assetAddress, input.intent.expectedAssetAddress);
    const amountMatches =
      !input.intent.expectedAmountMicroUsdc ||
      transfer.amount === input.intent.expectedAmountMicroUsdc;
    return payerMatches && recipientMatches && assetMatches && amountMatches;
  });
  const matchingTransfer = matchingTransfers[0];

  const matchingNativeTransfer =
    input.intent.action === "transfer" &&
    transaction.to !== null &&
    nativeValueMicroUsdc !== null &&
    (!input.intent.expectedDebitAddress ||
      sameAddress(transaction.from, input.intent.expectedDebitAddress)) &&
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
      message:
        "No transfer matched the declared payer, recipient, asset, and amount.",
    });
  }

  if (
    input.intent.action === "transfer" &&
    input.intent.expectedAmountMicroUsdc === "0"
  ) {
    findings.push({
      code: "ZERO_TRANSFER_AMOUNT",
      severity: "critical",
      message: "A zero-value transfer is not valid payment evidence.",
    });
  }

  if (
    input.intent.action === "transfer" &&
    !input.intent.expectedDebitAddress
  ) {
    findings.push({
      code: "DEBIT_ADDRESS_NOT_DECLARED",
      severity: "warning",
      message:
        "The intent did not declare a payer, so the result cannot be strict payment evidence.",
    });
  }

  if (input.intent.action === "transfer") {
    if (matchingTransfer && nativeValue > 0n) {
      findings.push({
        code: "UNEXPECTED_NATIVE_VALUE",
        severity: "critical",
        message:
          "The ERC-20 payment transaction also transferred unexpected native value.",
      });
    }
    const unexpectedTransfers = transfers.filter(
      (transfer) => transfer !== matchingTransfer,
    );
    if (unexpectedTransfers.length > 0) {
      findings.push({
        code: "UNEXPECTED_TRANSFER",
        severity: "critical",
        message:
          "The transaction emitted additional or non-matching transfer events.",
      });
    }
    if (approvals.length > 0) {
      findings.push({
        code: "UNEXPECTED_APPROVAL",
        severity: "critical",
        message: "The transfer transaction emitted an unexpected approval event.",
      });
    }
  }

  const matchingApprovals = approvals.filter(
    (approval) =>
      (!input.intent.expectedDebitAddress ||
        sameAddress(approval.owner, input.intent.expectedDebitAddress)) &&
      sameAddress(approval.spender, input.intent.expectedRecipient!) &&
      sameAddress(approval.assetAddress, input.intent.expectedAssetAddress!) &&
      (approval.amount === input.intent.expectedAmountMicroUsdc ||
        (approval.amount === "unlimited" &&
          input.intent.expectedAmountMicroUsdc ===
            "115792089237316195423570985008687907853269984665640564039457584007913129639935")),
  );
  const matchingApproval = matchingApprovals[0];

  if (input.intent.action === "approve" && !matchingApproval) {
    findings.push({
      code: "EXPECTED_APPROVAL_NOT_FOUND",
      severity: "critical",
      message:
        "No approval event matched the declared spender, asset, and amount.",
    });
  }

  if (input.intent.action === "approve") {
    if (!input.intent.expectedDebitAddress) {
      findings.push({
        code: "DEBIT_ADDRESS_NOT_DECLARED",
        severity: "warning",
        message:
          "The intent did not declare the approval owner, so the result cannot be strict approval evidence.",
      });
    }
    if (transfers.length > 0) {
      findings.push({
        code: "UNEXPECTED_TRANSFER",
        severity: "critical",
        message: "The approval transaction emitted an unexpected transfer event.",
      });
    }
    if (nativeValue > 0n) {
      findings.push({
        code: "UNEXPECTED_NATIVE_VALUE",
        severity: "critical",
        message:
          "The approval transaction also transferred unexpected native value.",
      });
    }
    if (
      approvals.some(
        (approval) => approval !== matchingApproval,
      )
    ) {
      findings.push({
        code: "UNEXPECTED_APPROVAL",
        severity: "critical",
        message:
          "The transaction emitted additional or non-matching approval events.",
      });
    }
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
    approvals,
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
    approvals,
    findings,
    evidenceHash,
  };
}
