import { describe, expect, it } from "vitest";
import {
  getNetworkRegistry,
  requireEnabledNetwork,
} from "../src/config/networks.js";

describe("network activation gate", () => {
  it("uses the official Arc Testnet chain ID", () => {
    expect(requireEnabledNetwork("arcTestnet").chainId).toBe(5_042_002);
  });

  it("refuses Arc Mainnet until official parameters are available", () => {
    expect(getNetworkRegistry().arcMainnet.enabled).toBe(false);
    expect(() => requireEnabledNetwork("arcMainnet")).toThrow(/disabled/);
  });

  it("requires an exact configuration fingerprint before mainnet can activate", () => {
    const original = { ...process.env };
    process.env.ARC_MAINNET_ENABLED = "true";
    process.env.ARC_MAINNET_CHAIN_ID = "999999";
    process.env.ARC_MAINNET_RPC_URL = "https://rpc.example.test";
    process.env.ARC_MAINNET_USDC_ADDRESS =
      "0x3600000000000000000000000000000000000000";
    process.env.ARC_MAINNET_EXPLORER_URL = "https://explorer.example.test";

    try {
      const pending = getNetworkRegistry().arcMainnet;
      expect(pending.officialParametersComplete).toBe(true);
      expect(pending.enabled).toBe(false);
      expect(pending.activation).toBe("manual-required");

      process.env.ARC_MAINNET_CONFIG_APPROVED_SHA256 =
        pending.configFingerprint!;
      const fingerprintOnly = getNetworkRegistry().arcMainnet;
      expect(fingerprintOnly.enabled).toBe(false);
      expect(fingerprintOnly.activation).toBe("manual-required");

      process.env.ARC_MAINNET_RELEASE_APPROVAL =
        "APPROVE_ARC_MAINNET_CANARY";
      const approved = getNetworkRegistry().arcMainnet;
      expect(approved.enabled).toBe(true);
      expect(approved.activation).toBe("manual-canary");
    } finally {
      process.env = original;
    }
  });
});
