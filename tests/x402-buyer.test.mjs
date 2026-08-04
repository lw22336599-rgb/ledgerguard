import { describe, expect, it } from "vitest";
import {
  EXPECTED,
  assertArcTestnetClient,
  assertRequirements,
  parseBuyerSecret,
} from "../scripts/x402-buyer.mjs";

const valid = {
  scheme: "exact",
  network: EXPECTED.network,
  asset: EXPECTED.asset,
  amount: EXPECTED.amount,
  payTo: EXPECTED.payTo,
  extra: { verifyingContract: EXPECTED.verifyingContract },
};

describe("x402 buyer safety gate", () => {
  it("accepts the exact controlled test payment", () => {
    expect(() => assertRequirements(valid)).not.toThrow();
  });

  it.each([
    ["scheme", { scheme: "upto" }],
    ["network", { network: "eip155:1" }],
    ["asset", { asset: "0x0000000000000000000000000000000000000001" }],
    ["amount", { amount: "1001" }],
    ["recipient", { payTo: "0x0000000000000000000000000000000000000001" }],
    [
      "verifying contract",
      {
        extra: {
          verifyingContract: "0x0000000000000000000000000000000000000001",
        },
      },
    ],
  ])("rejects an unexpected %s", (_label, patch) => {
    const requirements = {
      ...valid,
      ...patch,
      extra: patch.extra ?? valid.extra,
    };
    expect(() => assertRequirements(requirements)).toThrow();
  });

  it("accepts only the exact disposable-key file format", () => {
    const key = `0x${"ab".repeat(32)}`;
    expect(parseBuyerSecret(`X402_BUYER_PRIVATE_KEY=${key}\n`)).toBe(key);
  });

  it.each([
    "",
    `PRIVATE_KEY=0x${"ab".repeat(32)}\n`,
    `X402_BUYER_PRIVATE_KEY=0x1234\n`,
    `X402_BUYER_PRIVATE_KEY=0x${"ab".repeat(32)}\nEXTRA=value\n`,
  ])("rejects a malformed or ambiguous buyer secret", (contents) => {
    expect(() => parseBuyerSecret(contents)).toThrow("malformed");
  });

  it("accepts only an Arc Testnet client connected to chain 5042002", async () => {
    await expect(
      assertArcTestnetClient({
        chainName: "arcTestnet",
        publicClient: { getChainId: async () => 5_042_002 },
      }),
    ).resolves.toBeUndefined();

    await expect(
      assertArcTestnetClient({
        chainName: "arcTestnet",
        publicClient: { getChainId: async () => 1 },
      }),
    ).rejects.toThrow("not Arc Testnet");
  });
});
