import { encodeFunctionData, parseAbi } from "viem";
import { describe, expect, it, vi } from "vitest";
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
    expect(await page.text()).toContain("Control what may be paid.");
    expect(page.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
    expect(page.headers.get("access-control-expose-headers")).toContain(
      "Payment-Required",
    );
    expect(page.headers.get("x-ledgerguard-request-id")).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
    expect(page.headers.get("access-control-expose-headers")).toContain(
      "X-LedgerGuard-Request-Id",
    );

    const meta = await app.request("/v1/meta");
    expect(meta.status).toBe(200);
    expect((await meta.json()).service).toBe("LedgerGuard");
    expect(meta.headers.get("cache-control")).toBe("no-store");
  });

  it("serves human-readable docs, catalog, and status pages", async () => {
    for (const path of [
      "/",
      "/protect",
      "/developers",
      "/docs",
      "/catalog",
      "/test",
      "/guard/create",
      "/docs/integration",
    ]) {
      const response = await app.request(path);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
      const html = await response.text();
      expect(html).toContain('<html lang="en">');
      expect(html).not.toMatch(/\p{Script=Han}/u);
    }
    expect(await (await app.request("/docs")).text()).toContain(
      "API documentation",
    );
  });

  it("uses LedgerGuard as the single public entry and routes to Meter", async () => {
    const protect = await app.request("/protect");
    expect(protect.status).toBe(200);
    expect(await protect.text()).toContain("Let rules protect funds.");

    const meter = await app.request("/meter", { redirect: "manual" });
    expect(meter.status).toBe(302);
    expect(meter.headers.get("location")).toBe(
      "https://arc-meter-xi.vercel.app/",
    );

    const receipts = await app.request("/receipts", { redirect: "manual" });
    expect(receipts.status).toBe(302);
    expect(receipts.headers.get("location")).toBe(
      "https://arc-meter-xi.vercel.app/#flow",
    );
  });

  it("rejects malformed Guard Links and publishes protocol boundaries", async () => {
    const guard = await app.request("/guard?amount=1&purpose=Missing%20recipient");
    expect(guard.status).toBe(400);
    expect(await guard.json()).toMatchObject({
      error: "INVALID_GUARD_LINK",
    });

    const adapters = await app.request("/v1/adapters");
    expect(adapters.status).toBe(200);
    expect(await adapters.json()).toMatchObject({
      adapters: expect.arrayContaining([
        expect.objectContaining({
          id: "x402-receipt",
          status: "implemented-read-only",
          signing: false,
        }),
        expect.objectContaining({
          id: "ap2-mandate",
          status: "interface-only",
          enabled: false,
        }),
      ]),
    });
  });

  it("creates a validated, time-bound Guard Link and renders its receipt", async () => {
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const created = await app.request("/v1/guard-links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        issuer: "Example Agent",
        recipient,
        amount: "1.25",
        limit: "2.00",
        purpose: "Invoice 42",
        expires,
      }),
    });
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body).toMatchObject({
      network: "arcTestnet",
      custody: "none",
      expires,
      intentId: expect.stringMatching(/^[0-9a-f]{20}$/),
    });
    expect(body.url).toContain("/guard?");
    expect(body.url).toContain("issuer=Example+Agent");

    const receipt = await app.request(new URL(body.url).pathname + new URL(body.url).search);
    expect(receipt.status).toBe(200);
    const html = await receipt.text();
    expect(html).toContain("Example Agent");
    expect(html).toContain(body.intentId);
    expect(html).toContain("Connect test wallet");

    const invalid = await app.request("/v1/guard-links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipient,
        amount: "0",
        purpose: "Invalid zero payment",
      }),
    });
    expect(invalid.status).toBe(400);

    const noExpiry = await app.request("/v1/guard-links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipient,
        amount: "1",
        purpose: "Missing expiry",
      }),
    });
    expect(noExpiry.status).toBe(400);
    expect(await noExpiry.json()).toMatchObject({
      error: "INVALID_GUARD_LINK_EXPIRY",
    });
  });

  it("serves browser assets and machine documents with correct formats", async () => {
    const css = await app.request("/styles.css");
    expect(css.status).toBe(200);
    expect(css.headers.get("content-type")).toContain("text/css");

    const js = await app.request("/app.js");
    expect(js.status).toBe(200);
    expect(js.headers.get("content-type")).toContain("text/javascript");

    for (const path of ["/guard.js", "/guard-builder.js"]) {
      const asset = await app.request(path);
      expect(asset.status).toBe(200);
      expect(asset.headers.get("content-type")).toContain("text/javascript");
    }

    for (const path of ["/favicon.svg", "/favicon.ico", "/favicon.png"]) {
      const icon = await app.request(path);
      expect(icon.status).toBe(200);
      expect(icon.headers.get("content-type")).toContain("image/svg+xml");
      expect(await icon.text()).toContain("<svg");
    }

    const openapi = await app.request("/openapi.json");
    expect(openapi.status).toBe(200);
    expect((await openapi.json()).openapi).toBe("3.1.0");
  });

  it("reports process health", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("publishes agent-readable discovery documents", async () => {
    const catalog = await app.request("/.well-known/ledgerguard.json");
    expect(catalog.status).toBe(200);
    const body = await catalog.json();
    expect(body.resources[0].paymentProtocol).toBe("x402-v2");
    expect(body.resources[0].network).toBe("eip155:5042002");
    expect(body.resources[1]).toMatchObject({
      id: "arc-strict-evidence",
      method: "POST",
      deliverable: "strict-evidence-receipt",
    });
    expect(body.mcp).toMatchObject({
      transport: "streamable-http",
      authentication: "bearer-api-key",
    });
    expect(body.commercialCandidate).toMatchObject({
      network: "eip155:8453",
      realFundsEnabled: false,
    });
    expect(body.bazaarCandidate).toMatchObject({
      network: "eip155:84532",
      testAssetsOnly: true,
      indexed: false,
    });
    expect(body.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "base-sepolia-strict-evidence",
          network: "eip155:84532",
          discovery: "cdp-bazaar-candidate",
        }),
      ]),
    );
    expect(body.humanDocs).toBe(
      "https://ledgerguard-gules.vercel.app/docs",
    );
    expect(body.testing).toBe(
      "https://ledgerguard-gules.vercel.app/test",
    );
    expect(body.support).toBe(
      "https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose",
    );
    expect(body.guardLinkBuilder).toBe(
      "https://ledgerguard-gules.vercel.app/guard/create",
    );
    expect(body.social).toMatchObject({
      x: "https://x.com/HuiLibaa",
      handle: "@HuiLibaa",
    });

    const llms = await app.request("/llms.txt");
    expect(llms.status).toBe(200);
    expect(await llms.text()).toContain("never send a seed phrase");
  });

  it("exposes an honest fail-closed Bazaar readiness endpoint", async () => {
    const response = await app.request("/v1/bazaar-candidate");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      lifecycle: "testnet",
      network: "eip155:84532",
      settleEnabled: false,
      indexed: false,
    });
  });

  it("reports Arc RPC readiness and renders the live status", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        Response.json([
          { jsonrpc: "2.0", id: 1, result: "0x4cef52" },
          { jsonrpc: "2.0", id: 2, result: "0x64" },
        ]),
    );
    const ready = await app.request("/ready");
    expect(ready.status).toBe(200);
    expect(await ready.json()).toMatchObject({
      ok: true,
      chainId: 5_042_002,
      blockNumber: "100",
    });
    const status = await app.request("/status");
    expect(status.status).toBe(200);
    const statusHtml = await status.text();
    expect(statusHtml).toContain("Block 100");
    expect(statusHtml).toContain('<html lang="en">');
    expect(statusHtml).not.toMatch(/\p{Script=Han}/u);
    fetchMock.mockRestore();
  });

  it("records a sanitized request event without client IP data", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    await app.request("/v1/meta", {
      headers: {
        "x-real-ip": "203.0.113.7",
        "x-ledgerguard-client": "test-suite/1.0",
        "x-ledgerguard-integration": "public-beta-example",
      },
    });
    const event = info.mock.calls
      .flat()
      .find(
        (value): value is Record<string, unknown> =>
          typeof value === "object" &&
          value !== null &&
          value.event === "request.completed",
      );
    expect(event).toMatchObject({
      event: "request.completed",
      method: "GET",
      path: "/v1/meta",
      status: 200,
      client: "test-suite/1.0",
      integration: "public-beta-example",
    });
    expect(JSON.stringify(event)).not.toContain("203.0.113.7");
    info.mockRestore();
  });

  it("exposes mainnet as disabled", async () => {
    const response = await app.request("/v1/networks");
    const body = await response.json();
    const mainnet = body.networks.find(
      (network: { name: string }) => network.name === "arcMainnet",
    );
    expect(mainnet.enabled).toBe(false);
    expect(mainnet.chainId).toBeNull();
    expect(body.shadows[0]).toMatchObject({
      name: "arcMainnet5042",
      mode: "read-only-shadow",
      chainId: 5_042,
      realFundsEnabled: false,
      signingEnabled: false,
      x402MainnetEnabled: false,
    });
  });

  it("fails closed when the 5042 shadow is not configured", async () => {
    const response = await app.request("/v1/shadow/arc-mainnet");
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      ok: false,
      mode: "read-only-shadow",
      realFundsEnabled: false,
      signingEnabled: false,
      x402MainnetEnabled: false,
    });
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

  it("keeps a deterministic transfer in review when RPC simulation is skipped", async () => {
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
    const body = await response.json();
    expect(body.decision).toBe("REVIEW");
    expect(body.findings.map((finding: { code: string }) => finding.code)).toContain(
      "SIMULATION_REQUIRED",
    );
  });

  it("rejects invalid JSON, oversized bodies, and unknown routes", async () => {
    const invalid = await app.request("/v1/preflight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error).toBe("INVALID_REQUEST");

    const oversized = await app.request("/v1/preflight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filler: "x".repeat(70_000) }),
    });
    expect(oversized.status).toBe(413);
    expect((await oversized.json()).error).toBe("REQUEST_BODY_TOO_LARGE");

    const missing = await app.request("/not-a-route");
    expect(missing.status).toBe(404);
    expect((await missing.json()).error).toBe("NOT_FOUND");
  });

  it("fails closed for invalid evidence and disabled x402", async () => {
    const evidence = await app.request("/v1/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(evidence.status).toBe(400);
    expect((await evidence.json()).error).toBe("INVALID_REQUEST");

    const previous = process.env.X402_ENABLED;
    process.env.X402_ENABLED = "false";
    const paid = await app.request("/v1/paid/network-risk");
    expect(paid.status).toBe(503);
    expect((await paid.json()).error).toBe("X402_DISABLED");
    if (previous === undefined) delete process.env.X402_ENABLED;
    else process.env.X402_ENABLED = previous;
  });
});
