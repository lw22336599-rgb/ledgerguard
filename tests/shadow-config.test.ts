import { afterEach, describe, expect, it } from "vitest";
import { getArcMainnetShadowConfiguration } from "../src/config/shadow.js";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
});

describe("Arc 5042 shadow configuration", () => {
  it("is disabled and fail-closed by default", () => {
    delete process.env.ARC_MAINNET_SHADOW_ENABLED;
    delete process.env.ARC_MAINNET_SHADOW_RPC_URLS;
    delete process.env.ARC_MAINNET_SHADOW_OBSERVER_URLS;

    const config = getArcMainnetShadowConfiguration();
    expect(config).toMatchObject({
      enabled: false,
      ready: false,
      mode: "read-only-shadow",
      chainId: 5_042,
      configFingerprint: null,
    });
  });

  it("requires an independent RPC and observer", () => {
    process.env.ARC_MAINNET_SHADOW_ENABLED = "true";
    process.env.ARC_MAINNET_SHADOW_RPC_URLS =
      "https://one.example/rpc,https://one.example/other,http://two.example";
    delete process.env.ARC_MAINNET_SHADOW_OBSERVER_URLS;

    const config = getArcMainnetShadowConfiguration();
    expect(config.ready).toBe(false);
    expect(config.rpcHosts).toEqual(["one.example"]);
  });

  it("becomes ready without activating funds, signing, or payments", () => {
    process.env.ARC_MAINNET_SHADOW_ENABLED = "true";
    process.env.ARC_MAINNET_SHADOW_RPC_URLS =
      "https://one.example";
    process.env.ARC_MAINNET_SHADOW_OBSERVER_URLS =
      "https://observer.example/status";

    const config = getArcMainnetShadowConfiguration();
    expect(config.ready).toBe(true);
    expect(config.rpcHosts).toEqual(["one.example"]);
    expect(config.observerHosts).toEqual(["observer.example"]);
    expect(config.configFingerprint).toMatch(/^[0-9a-f]{64}$/);
  });
});
