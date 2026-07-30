import type { Hex } from "viem";
import { requireEnabledNetwork } from "../config/networks.js";
import { createNetworkClient, withDeadline } from "../lib/rpc.js";
import type { EvidenceInput } from "../schemas.js";
import { buildEvidence, type EvidenceResult } from "./evidence.js";

export class TransactionNotFoundError extends Error {
  constructor() {
    super("Transaction not found.");
    this.name = "TransactionNotFoundError";
  }
}

export async function retrieveEvidence(
  input: EvidenceInput,
): Promise<EvidenceResult> {
  requireEnabledNetwork(input.network);
  const client = createNetworkClient(input.network);
  const txHash = input.txHash as Hex;
  try {
    const [transaction, receipt] = await withDeadline(
      Promise.all([
        client.getTransaction({ hash: txHash }),
        client.getTransactionReceipt({ hash: txHash }),
      ]),
      12_000,
    );
    let recipientHasCode: boolean | undefined;
    if (transaction.to !== null) {
      try {
        const bytecode = await withDeadline(
          client.getBytecode({
            address: transaction.to,
            blockNumber: receipt.blockNumber,
          }),
          8_000,
        );
        recipientHasCode = Boolean(bytecode && bytecode !== "0x");
      } catch (error) {
        console.warn("Recipient bytecode lookup failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          message:
            error instanceof Error
              ? error.message.slice(0, 500)
              : "Unknown error",
        });
      }
    }
    return buildEvidence(input, transaction, receipt, recipientHasCode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("could not be found") || message.includes("not found")) {
      throw new TransactionNotFoundError();
    }
    throw error;
  }
}
