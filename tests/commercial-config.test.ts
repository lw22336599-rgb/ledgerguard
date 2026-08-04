import { afterEach, describe, expect, it } from "vitest";
import { getCommercialCandidate } from "../src/config/commercial.js";

const keys = [
  "BASE_MAINNET_X402_ENABLED",
  "BASE_MAINNET_PUBLIC_CANARY_ENABLED",
  "BASE_MAINNET_RELEASE_APPROVAL",
  "BASE_MAINNET_CONFIG_APPROVED_SHA256",
  "BASE_MAINNET_PRICE_MICRO_USDC",
  "CDP_API_KEY_ID",
  "CDP_API_KEY_SECRET",
  "SELLER_ADDRESS",
] as const;

describe("commercial production candidate", () => {
  afterEach(() => {
    for (const key of keys) delete process.env[key];
  });

  it("publishes Base metadata while failing closed by default", () => {
    const candidate = getCommercialCandidate();
    expect(candidate).toMatchObject({
      network: "eip155:8453",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      facilitator: "https://api.cdp.coinbase.com/platform/v2/x402",
      requested: false,
      ready: false,
      realFundsEnabled: false,
    });
    expect(
      candidate.activationGates.find((gate) => gate.id === "explicit-enable")
        ?.passed,
    ).toBe(false);
    expect(
      candidate.activationGates.find(
        (gate) => gate.id === "bounded-canary-price",
      )?.passed,
    ).toBe(true);
  });

  it("requires independent approval, credentials, and a valid seller address", () => {
    process.env.BASE_MAINNET_X402_ENABLED = "true";
    expect(getCommercialCandidate()).toMatchObject({
      requested: true,
      ready: false,
      realFundsEnabled: false,
    });

    process.env.BASE_MAINNET_RELEASE_APPROVAL =
      "APPROVE_BASE_MAINNET_CANARY";
    process.env.BASE_MAINNET_PUBLIC_CANARY_ENABLED = "true";
    process.env.CDP_API_KEY_ID = "organizations/example/apiKeys/example";
    process.env.CDP_API_KEY_SECRET = "sensitive";
    process.env.SELLER_ADDRESS =
      "0xf1437d9cd304ae49f2ec005ac967813b3a7c466c";
    const reviewCandidate = getCommercialCandidate();
    expect(reviewCandidate).toMatchObject({
      requested: true,
      ready: false,
      realFundsEnabled: false,
    });
    process.env.BASE_MAINNET_CONFIG_APPROVED_SHA256 =
      reviewCandidate.configFingerprint;
    expect(getCommercialCandidate()).toMatchObject({
      requested: true,
      ready: true,
      realFundsEnabled: true,
    });
  });

  it("rejects an invalid or excessive canary price", () => {
    process.env.BASE_MAINNET_PRICE_MICRO_USDC = "100001";
    const candidate = getCommercialCandidate();
    expect(candidate.priceMicroUsdc).toBe("100001");
    expect(
      candidate.activationGates.find(
        (gate) => gate.id === "bounded-canary-price",
      )?.passed,
    ).toBe(false);
  });
});
