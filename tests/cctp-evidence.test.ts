import {
  encodeAbiParameters,
  encodeEventTopics,
  parseAbiParameters,
  type Address,
  type Hex,
} from "viem";
import { describe, expect, it, vi } from "vitest";
import { ARC_TESTNET_USDC } from "../src/config/networks.js";
import { retrieveCctpEvidence } from "../src/services/cctp-evidence.js";

const recipient = "0x2222222222222222222222222222222222222222";
const sourceTxHash = `0x${"11".repeat(32)}` as Hex;
const destinationTxHash = `0x${"22".repeat(32)}` as Hex;
const transferEvent = {
  type: "event",
  name: "Transfer",
  inputs: [
    { indexed: true, name: "from", type: "address" },
    { indexed: true, name: "to", type: "address" },
    { indexed: false, name: "value", type: "uint256" },
  ],
} as const;

function irisResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      messages: [
        {
          status: "complete",
          attestation: "0x1234",
          forwardTxHash: destinationTxHash,
          decodedMessage: {
            messageBody: {
              destinationDomain: 26,
              mintRecipient: `0x${"0".repeat(24)}${recipient.slice(2)}`,
              amount: "1000",
            },
          },
          ...overrides,
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function arcClient(value = 1000n) {
  return {
    getTransactionReceipt: vi.fn(async () => ({
      status: "success",
      logs: [
        {
          address: ARC_TESTNET_USDC,
          topics: encodeEventTopics({
            abi: [transferEvent],
            eventName: "Transfer",
            args: {
              from: "0x0000000000000000000000000000000000000000",
              to: recipient as Address,
            },
          }),
          data: encodeAbiParameters(parseAbiParameters("uint256"), [value]),
        },
      ],
    })),
  };
}

describe("CCTP evidence", () => {
  it("only verifies when attestation, destination mint, and exact delivery match", async () => {
    const result = await retrieveCctpEvidence(
      {
        sourceTxHash,
        recipient,
        amountMicroUsdc: "1000",
        feeMicroUsdc: "1",
      },
      {
        fetch: vi.fn(async () => irisResponse()),
        createArcClient: vi.fn(() => arcClient()) as never,
      },
    );

    expect(result).toMatchObject({
      status: "VERIFIED",
      stages: {
        burn: true,
        attestation: true,
        mint: true,
        delivery: true,
      },
      destinationTxHash,
      billing: {
        feeMicroUsdc: "1",
        state: "SETTLED_WITH_BRIDGE",
      },
    });
  });

  it("fails closed when the mint amount differs from the declared intent", async () => {
    const result = await retrieveCctpEvidence(
      {
        sourceTxHash,
        recipient,
        amountMicroUsdc: "1000",
        feeMicroUsdc: "1",
      },
      {
        fetch: vi.fn(async () => irisResponse()),
        createArcClient: vi.fn(() => arcClient(999n)) as never,
      },
    );

    expect(result.status).toBe("MISMATCH");
    expect(result.stages.delivery).toBe(false);
    expect(result).toMatchObject({
      billing: { state: "NOT_CONFIRMED" },
    });
  });

  it("returns pending without inventing mint evidence while Iris is waiting", async () => {
    const result = await retrieveCctpEvidence(
      {
        sourceTxHash,
        recipient,
        amountMicroUsdc: "1000",
        feeMicroUsdc: "0",
      },
      {
        fetch: vi.fn(
          async () =>
            new Response(JSON.stringify({ messages: [] }), { status: 200 }),
        ),
      },
    );

    expect(result).toMatchObject({
      status: "PENDING",
      destinationTxHash: null,
      stages: { burn: false, attestation: false, mint: false, delivery: false },
    });
  });
});
