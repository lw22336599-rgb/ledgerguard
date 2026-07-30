import { beforeEach, describe, expect, it } from "vitest";
import {
  BASE_SEPOLIA_NETWORK,
  BASE_SEPOLIA_USDC,
  getBazaarCandidate,
} from "../src/config/bazaar.js";

describe("CDP Bazaar testnet candidate", () => {
  beforeEach(() => {
    delete process.env.BASE_SEPOLIA_X402_ENABLED;
    delete process.env.CDP_API_KEY_ID;
    delete process.env.CDP_API_KEY_SECRET;
    process.env.SELLER_ADDRESS =
      "0xf1437d9cd304ae49f2ec005ac967813b3a7c466c";
  });

  it("publishes the official Base Sepolia network and USDC address", () => {
    const candidate = getBazaarCandidate();

    expect(BASE_SEPOLIA_NETWORK).toBe("eip155:84532");
    expect(BASE_SEPOLIA_USDC).toBe(
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    );
    expect(candidate).toMatchObject({
      lifecycle: "testnet",
      network: "eip155:84532",
      asset: BASE_SEPOLIA_USDC,
      testAssetsOnly: true,
      settleEnabled: false,
      indexed: false,
    });
  });

  it("fails closed until explicit enablement and both CDP credentials exist", () => {
    process.env.BASE_SEPOLIA_X402_ENABLED = "true";
    let candidate = getBazaarCandidate();
    expect(candidate.ready).toBe(false);
    expect(candidate.activationGates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "cdp-credentials", passed: false }),
      ]),
    );

    process.env.CDP_API_KEY_ID = "organizations/example/apiKeys/example";
    process.env.CDP_API_KEY_SECRET = "secret";
    candidate = getBazaarCandidate();
    expect(candidate.ready).toBe(true);
    expect(candidate.settleEnabled).toBe(true);
    expect(candidate.indexed).toBe(false);
  });

  it("never treats configuration as Bazaar indexing proof", () => {
    process.env.BASE_SEPOLIA_X402_ENABLED = "true";
    process.env.CDP_API_KEY_ID = "organizations/example/apiKeys/example";
    process.env.CDP_API_KEY_SECRET = "secret";

    const candidate = getBazaarCandidate();
    expect(candidate.indexed).toBe(false);
    expect(candidate.indexingProof).toBeNull();
    expect(candidate.reason).toContain("successful CDP testnet settlement");
  });
});
