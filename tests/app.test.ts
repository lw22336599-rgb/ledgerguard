import { encodeFunctionData, parseAbi } from "viem";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { ARC_TESTNET_USDC } from "../src/config/networks.js";

const transferAbi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);
const recipient = "0x2222222222222222222222222222222222222222";

describe("HTTP API", () => {
  it("serves the public demo and machine metadata", async () => {
    const page = await app.request("/");
    expect(page.status).toBe(200);
    expect(page.headers.get("content-type")).toContain("text/html");
    expect(await page.text()).toContain("Let agents pay.");

    const meta = await app.request("/v1/meta");
    expect(meta.status).toBe(200);
    expect((await meta.json()).service).toBe("LedgerGuard");
    expect(meta.headers.get("cache-control")).toBe("no-store");
  });

  it("reports process health", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
  });

  it("exposes mainnet as disabled", async () => {
    const response = await app.request("/v1/networks");
    const body = await response.json();
    const mainnet = body.networks.find(
      (network: { name: string }) => network.name === "arcMainnet",
    );
    expect(mainnet.enabled).toBe(false);
    expect(mainnet.chainId).toBeNull();
  });

  it("rejects Arc Mainnet requests", async () => {
    const response = await app.request("/v1/preflight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        network: "arcMainnet",
        to: recipient,
        intent: {
          action: "contract_call",
          purpose: "Mainnet must stay disabled",
        },
        policy: {},
      }),
    });
    expect(response.status).toBe(503);
    expect((await response.json()).error).toBe("NETWORK_DISABLED");
  });

  it("evaluates a deterministic transfer without requiring RPC simulation", async () => {
    const response = await app.request("/v1/preflight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: ARC_TESTNET_USDC,
        data: encodeFunctionData({
          abi: transferAbi,
          functionName: "transfer",
          args: [recipient, 1_000_000n],
        }),
        intent: {
          action: "transfer",
          expectedRecipient: recipient,
          expectedAssetAddress: ARC_TESTNET_USDC,
          expectedAmountMicroUsdc: "1000000",
          purpose: "API integration test",
        },
        policy: {
          requireSimulation: false,
          maxAmountMicroUsdc: "1000000",
        },
      }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).decision).toBe("ALLOW");
  });
});
