import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import {
  listNetworkAdapters,
  resolveNetworkAdapter,
} from "../src/adapters/network-adapter.js";

describe("network adapters", () => {
  it("lists Arc Testnet as an enabled adapter", () => {
    const adapters = listNetworkAdapters();
    expect(adapters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "arcTestnet",
          enabled: true,
          nativeUsdcGas: true,
        }),
      ]),
    );
  });

  it("resolves the official Arc Testnet USDC address", () => {
    const adapter = resolveNetworkAdapter("arcTestnet");
    expect(adapter.usdcAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(adapter.chainId).toBe(5_042_002);
  });

  it("publishes adapter metadata without raw RPC URLs", async () => {
    const response = await app.request("/v1/network-adapters");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.adapters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "arcTestnet",
          rpcConfigured: expect.any(Boolean),
        }),
      ]),
    );
    for (const adapter of body.adapters) {
      expect(adapter.rpcUrls).toBeUndefined();
    }
  });

  it("keeps Base mainnet disabled unless BASE_PREFLIGHT_ENABLED=true", () => {
    const original = process.env.BASE_PREFLIGHT_ENABLED;
    delete process.env.BASE_PREFLIGHT_ENABLED;
    expect(listNetworkAdapters().some((adapter) => adapter.name === "baseMainnet")).toBe(
      false,
    );
    if (original !== undefined) process.env.BASE_PREFLIGHT_ENABLED = original;
  });
});
