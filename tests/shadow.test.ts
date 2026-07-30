import { afterEach, describe, expect, it, vi } from "vitest";
import { getArcMainnetShadowStatus, resetShadowStateForTests } from "../src/services/shadow.js";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
  resetShadowStateForTests();
  vi.restoreAllMocks();
});

describe("Arc 5042 shadow status", () => {
  it("returns a fail-closed status when it is disabled", async () => {
    delete process.env.ARC_MAINNET_SHADOW_ENABLED;
    delete process.env.ARC_MAINNET_SHADOW_RPC_URLS;
    delete process.env.ARC_MAINNET_SHADOW_OBSERVER_URLS;

    const status = await getArcMainnetShadowStatus();
    expect(status).toMatchObject({
      ok: false,
      enabled: false,
      realFundsEnabled: false,
      signingEnabled: false,
      x402MainnetEnabled: false,
      chainId: 5_042,
    });
  });

  it("publishes only sanitized read-only consensus state", async () => {
    process.env.ARC_MAINNET_SHADOW_ENABLED = "true";
    process.env.ARC_MAINNET_SHADOW_RPC_URLS =
      "https://one.example/private-path";
    process.env.ARC_MAINNET_SHADOW_OBSERVER_URLS =
      "https://observer.example/secret-status";
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (_input, init) =>
        init?.method === "POST"
          ? Response.json([
              { jsonrpc: "2.0", id: 1, result: "0x13b2" },
              { jsonrpc: "2.0", id: 2, result: "0x64" },
              { jsonrpc: "2.0", id: 3, result: "0x6001" },
              { jsonrpc: "2.0", id: 4, result: "0x6002" },
            ])
          : Response.json({
              components: {
                monitor: {
                  health: "UP",
                  details: {
                    chainID: 5_042,
                    block: { number: 101, status: "VALIDATED" },
                  },
                },
              },
            }),
    );

    const status = await getArcMainnetShadowStatus(true);
    expect(status).toMatchObject({
      ok: true,
      healthyRpcs: 1,
      healthyObservers: 1,
      contractsConsistent: true,
      rpcHosts: [
        { host: "one.example", healthy: true },
      ],
      observerHosts: [{ host: "observer.example", healthy: true }],
    });
    expect(JSON.stringify(status)).not.toContain("private-path");
    expect(JSON.stringify(status)).not.toContain("secret-status");
    expect(JSON.stringify(status)).not.toContain("0x6001");
  });

  it("opens the local circuit after repeated consensus failures", async () => {
    process.env.ARC_MAINNET_SHADOW_ENABLED = "true";
    process.env.ARC_MAINNET_SHADOW_RPC_URLS =
      "https://one.example";
    process.env.ARC_MAINNET_SHADOW_OBSERVER_URLS =
      "https://observer.example/status";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(null, { status: 503 }));

    await getArcMainnetShadowStatus(true);
    await getArcMainnetShadowStatus(true);
    await getArcMainnetShadowStatus(true);
    const status = await getArcMainnetShadowStatus();

    expect(status).toMatchObject({
      ok: false,
      circuitOpen: true,
      realFundsEnabled: false,
      signingEnabled: false,
      x402MainnetEnabled: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
