import {
  decodeEventLog,
  getAddress,
  isAddressEqual,
  keccak256,
  stringToHex,
  type Address,
  type Hex,
  type Log,
} from "viem";
import { ARC_TESTNET_USDC } from "../config/networks.js";
import { createNetworkClient, withDeadline } from "../lib/rpc.js";

const transferAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
] as const;

const transferTopic = keccak256(stringToHex("Transfer(address,address,uint256)"));
const zeroAddress = "0x0000000000000000000000000000000000000000";

type IrisMessage = {
  attestation?: string;
  status?: string;
  forwardTxHash?: string;
  decodedMessage?: {
    destinationDomain?: string | number;
    mintRecipient?: string;
    messageBody?: {
      destinationDomain?: string | number;
      mintRecipient?: string;
      burnToken?: string;
      amount?: string;
    };
  };
};

export interface CctpEvidenceInput {
  sourceTxHash: Hex;
  recipient: Address;
  amountMicroUsdc: string;
  feeMicroUsdc: string;
}

function normalizedRecipient(value: unknown): Address | null {
  if (typeof value !== "string") return null;
  if (/^0x[0-9a-fA-F]{40}$/.test(value)) return getAddress(value);
  if (/^0x[0-9a-fA-F]{64}$/.test(value)) {
    return getAddress(`0x${value.slice(-40)}`);
  }
  return null;
}

function messageFields(message: IrisMessage) {
  const body = message.decodedMessage?.messageBody;
  return {
    destinationDomain:
      body?.destinationDomain ?? message.decodedMessage?.destinationDomain,
    recipient: normalizedRecipient(
      body?.mintRecipient ?? message.decodedMessage?.mintRecipient,
    ),
    amount: body?.amount,
  };
}

function matchesMintLog(
  logs: readonly Log[],
  recipient: Address,
  amountMicroUsdc: bigint,
): boolean {
  return logs.some((log) => {
    if (
      !isAddressEqual(log.address, ARC_TESTNET_USDC) ||
      log.topics[0]?.toLowerCase() !== transferTopic.toLowerCase()
    ) {
      return false;
    }
    try {
      const decoded = decodeEventLog({
        abi: transferAbi,
        data: log.data,
        topics: log.topics,
      });
      return (
        decoded.eventName === "Transfer" &&
        isAddressEqual(decoded.args.from, zeroAddress) &&
        isAddressEqual(decoded.args.to, recipient) &&
        decoded.args.value === amountMicroUsdc
      );
    } catch {
      return false;
    }
  });
}

export async function retrieveCctpEvidence(
  input: CctpEvidenceInput,
  dependencies: {
    fetch?: typeof fetch;
    createArcClient?: typeof createNetworkClient;
  } = {},
) {
  const fetcher = dependencies.fetch ?? fetch;
  const response = await withDeadline(
    fetcher(
      `https://iris-api-sandbox.circle.com/v2/messages/6?transactionHash=${encodeURIComponent(input.sourceTxHash)}`,
      { headers: { accept: "application/json" } },
    ),
    12_000,
  );
  if (!response.ok) {
    throw new Error(`Circle attestation service returned ${response.status}.`);
  }
  const payload = (await response.json()) as { messages?: IrisMessage[] };
  const message = payload.messages?.[0];
  if (!message) {
    return {
      status: "PENDING" as const,
      stages: { burn: false, attestation: false, mint: false, delivery: false },
      sourceTxHash: input.sourceTxHash,
      destinationTxHash: null,
      feeMicroUsdc: input.feeMicroUsdc,
    };
  }

  const fields = messageFields(message);
  const intentMatches =
    String(fields.destinationDomain) === "26" &&
    fields.recipient !== null &&
    isAddressEqual(fields.recipient, input.recipient) &&
    fields.amount === input.amountMicroUsdc;
  const attested =
    message.status?.toLowerCase() === "complete" &&
    typeof message.attestation === "string" &&
    /^0x[0-9a-fA-F]+$/.test(message.attestation);
  const destinationTxHash =
    typeof message.forwardTxHash === "string" &&
    /^0x[0-9a-fA-F]{64}$/.test(message.forwardTxHash)
      ? (message.forwardTxHash as Hex)
      : null;

  let mint = false;
  let delivery = false;
  if (destinationTxHash) {
    const client = (dependencies.createArcClient ?? createNetworkClient)(
      "arcTestnet",
    );
    const receipt = await withDeadline(
      client.getTransactionReceipt({ hash: destinationTxHash }),
      12_000,
    );
    mint = receipt.status === "success";
    delivery =
      mint &&
      intentMatches &&
      matchesMintLog(
        receipt.logs,
        input.recipient,
        BigInt(input.amountMicroUsdc),
      );
  }

  return {
    status:
      attested && mint && delivery
        ? ("VERIFIED" as const)
        : !intentMatches || (mint && !delivery)
          ? ("MISMATCH" as const)
          : ("PENDING" as const),
    stages: {
      burn: true,
      attestation: attested,
      mint,
      delivery,
    },
    sourceTxHash: input.sourceTxHash,
    destinationTxHash,
    route: {
      source: "Base Sepolia",
      sourceDomain: 6,
      destination: "Arc Testnet",
      destinationDomain: 26,
    },
    intent: {
      recipient: input.recipient,
      amountMicroUsdc: input.amountMicroUsdc,
      matches: intentMatches,
    },
    billing: {
      feeMicroUsdc: input.feeMicroUsdc,
      state: delivery ? "SETTLED_WITH_BRIDGE" : "NOT_CONFIRMED",
      split: "Circle 10% / configured recipient 90%",
    },
  };
}
