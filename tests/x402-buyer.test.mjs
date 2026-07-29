import { describe, expect, it } from "vitest";
import {
  EXPECTED,
  assertRequirements,
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
});
