import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import {
  getTenantStore,
  QuotaExceededError,
  resetTenantStoreForTests,
  TenantCapacityError,
} from "../src/services/tenant-store.js";

const recipient = "0x2222222222222222222222222222222222222222";
const usdc = "0x3600000000000000000000000000000000000000";
const transferData =
  "0xa9059cbb" +
  recipient.slice(2).padStart(64, "0") +
  "00000000000000000000000000000000000000000000000000000000000f4240";

describe("developer self-service", () => {
  beforeEach(() => {
    process.env.LEDGERGUARD_STORAGE_BACKEND = "memory";
    process.env.DEVELOPER_SELF_SERVICE_ENABLED = "true";
    resetTenantStoreForTests();
  });

  afterEach(() => {
    delete process.env.LEDGERGUARD_STORAGE_BACKEND;
    delete process.env.DEVELOPER_SELF_SERVICE_ENABLED;
    delete process.env.DEVELOPER_MAX_TENANTS;
    resetTenantStoreForTests();
  });

  it("creates a tenant, authenticates, meters usage, and rotates the key", async () => {
    const registration = await app.request("/v1/developer/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "External Test Project" }),
    });
    expect(registration.status).toBe(201);
    const created = await registration.json();
    expect(created.apiKey).toMatch(/^lg_test_[A-Za-z0-9_-]+$/);

    const account = await app.request("/v1/developer/account", {
      headers: { authorization: `Bearer ${created.apiKey}` },
    });
    expect(account.status).toBe(200);
    const initial = await account.json();
    expect(initial.tenant.name).toBe("External Test Project");
    expect(initial.usage.used).toBe(0);
    expect(JSON.stringify(initial)).not.toContain(created.apiKey);

    const preflight = await app.request("/v1/developer/preflight", {
      method: "POST",
      headers: {
        authorization: `Bearer ${created.apiKey}`,
        "content-type": "application/json",
        "x-ledgerguard-integration": "acme-agent-testnet",
      },
      body: JSON.stringify({
        network: "arcTestnet",
        to: usdc,
        data: transferData,
        valueWei: "0",
        intent: {
          action: "transfer",
          expectedRecipient: recipient,
          expectedAssetAddress: usdc,
          expectedAmountMicroUsdc: "1000000",
          purpose: "Metered test",
        },
        policy: {
          requireSimulation: false,
          maxAmountMicroUsdc: "1000000",
        },
      }),
    });
    expect(preflight.status).toBe(200);
    const preflightBody = await preflight.json();
    expect(preflightBody.usage.used).toBe(1);
    expect(preflightBody.usage.recent[0].integrationIdHash).toBe(
      `sha256:${createHash("sha256").update("acme-agent-testnet").digest("hex")}`,
    );
    expect(JSON.stringify(preflightBody.usage)).not.toContain(
      "acme-agent-testnet",
    );

    const rotation = await app.request("/v1/developer/keys/rotate", {
      method: "POST",
      headers: { authorization: `Bearer ${created.apiKey}` },
    });
    expect(rotation.status).toBe(200);
    const rotated = await rotation.json();
    expect(rotated.apiKey).not.toBe(created.apiKey);

    expect(
      (
        await app.request("/v1/developer/account", {
          headers: { authorization: `Bearer ${created.apiKey}` },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await app.request("/v1/developer/account", {
          headers: { authorization: `Bearer ${rotated.apiKey}` },
        })
      ).status,
    ).toBe(200);
  });

  it("runs product shadow without authorizing or signing a transaction", async () => {
    const registration = await app.request("/v1/developer/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Shadow Project" }),
    });
    const created = await registration.json();
    const shadow = await app.request("/v1/developer/shadow", {
      method: "POST",
      headers: {
        authorization: `Bearer ${created.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        network: "arcTestnet",
        to: usdc,
        data: transferData,
        valueWei: "0",
        intent: {
          action: "transfer",
          expectedRecipient: recipient,
          expectedAssetAddress: usdc,
          expectedAmountMicroUsdc: "1000000",
          purpose: "Observe before enforcement",
        },
        policy: {
          requireSimulation: false,
          maxAmountMicroUsdc: "1000000",
        },
      }),
    });
    expect(shadow.status).toBe(200);
    expect(await shadow.json()).toMatchObject({
      mode: "shadow",
      enforced: false,
      wouldDecision: "REVIEW",
      signingEnabled: false,
      custody: "none",
      usage: {
        used: 1,
        recent: [{ operation: "shadow" }],
      },
    });
  });

  it("serves the authenticated MCP Streamable HTTP handshake", async () => {
    const registration = await app.request("/v1/developer/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "MCP Project" }),
    });
    const created = await registration.json();
    const response = await app.request("/mcp", {
      method: "POST",
      headers: {
        authorization: `Bearer ${created.apiKey}`,
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "ledgerguard-test", version: "0.1.0" },
        },
      }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        serverInfo: { name: "ledgerguard-agent-firewall" },
      },
    });
  });

  it("fails closed without durable storage or valid authorization", async () => {
    delete process.env.LEDGERGUARD_STORAGE_BACKEND;
    resetTenantStoreForTests();
    expect(
      (
        await app.request("/v1/developer/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "No Store" }),
        })
      ).status,
    ).toBe(503);
    expect((await app.request("/v1/developer/account")).status).toBe(503);

    process.env.LEDGERGUARD_STORAGE_BACKEND = "memory";
    resetTenantStoreForTests();
    expect(
      (
        await app.request("/v1/developer/account", {
          headers: { authorization: "Bearer lg_test_invalid" },
        })
      ).status,
    ).toBe(401);
  });

  it("enforces the monthly quota atomically at the store boundary", async () => {
    const store = getTenantStore();
    expect(store).not.toBeNull();
    const registration = await store!.register("Quota Test");
    const constrained = { ...registration.tenant, quotaPerMonth: 1 };
    await expect(
      store!.recordUsage(constrained, "preflight", "request-1"),
    ).resolves.toMatchObject({ used: 1, remaining: 0 });
    await expect(
      store!.recordUsage(constrained, "preflight", "request-2"),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it("bounds the public tenant cohort and records payments idempotently", async () => {
    process.env.DEVELOPER_MAX_TENANTS = "1";
    resetTenantStoreForTests();
    const store = getTenantStore();
    expect(store).not.toBeNull();
    await expect(store!.health()).resolves.toBe(true);
    await expect(store!.register("First Tenant")).resolves.toBeDefined();
    await expect(store!.register("Second Tenant")).rejects.toBeInstanceOf(
      TenantCapacityError,
    );

    const payment = {
      requestId: "payment-request-1",
      payer: "0x1111111111111111111111111111111111111111",
      settlementTransaction:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      amountMicroUsdc: "1000",
      network: "arcTestnet" as const,
      recordedAt: new Date().toISOString(),
    };
    await expect(store!.recordPayment(payment)).resolves.toBe("recorded");
    await expect(
      store!.recordPayment({ ...payment, requestId: "payment-request-2" }),
    ).resolves.toBe("duplicate");
  });

  it("renders an English console without exposing an API key", async () => {
    const page = await app.request("/developer");
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("Developer Console");
    expect(html).not.toMatch(/\p{Script=Han}/u);
    expect(html).not.toMatch(/lg_test_[A-Za-z0-9_-]{43}/);
  });
});

describe("Redis REST tenant persistence", () => {
  const values = new Map<string, string>();
  const lists = new Map<string, string[]>();

  function execute(command: Array<string | number>): unknown {
    const [rawName, ...args] = command;
    const name = String(rawName).toUpperCase();
    if (name === "PING") return "PONG";
    if (name === "GET") return values.get(String(args[0])) ?? null;
    if (name === "INCR" || name === "DECR") {
      const key = String(args[0]);
      const delta = name === "INCR" ? 1 : -1;
      const next = Number.parseInt(values.get(key) ?? "0", 10) + delta;
      values.set(key, String(next));
      return next;
    }
    if (name === "SET") {
      const key = String(args[0]);
      const value = String(args[1]);
      const nx = args.some((item) => String(item).toUpperCase() === "NX");
      if (nx && values.has(key)) return null;
      values.set(key, value);
      return "OK";
    }
    if (name === "DEL") return values.delete(String(args[0])) ? 1 : 0;
    if (name === "LPUSH") {
      const key = String(args[0]);
      const list = lists.get(key) ?? [];
      list.unshift(String(args[1]));
      lists.set(key, list);
      return list.length;
    }
    if (name === "LTRIM") {
      const key = String(args[0]);
      const list = lists.get(key) ?? [];
      lists.set(key, list.slice(Number(args[1]), Number(args[2]) + 1));
      return "OK";
    }
    if (name === "LRANGE") {
      const list = lists.get(String(args[0])) ?? [];
      return list.slice(Number(args[1]), Number(args[2]) + 1);
    }
    if (name === "EVAL") {
      const usageCounter = String(args[2]);
      const events = String(args[3]);
      const quota = Number(args[4]);
      const current = Number(values.get(usageCounter) ?? "0");
      if (current >= quota) return [0, current];
      const next = current + 1;
      values.set(usageCounter, String(next));
      const recent = lists.get(events) ?? [];
      recent.unshift(String(args[6]));
      lists.set(events, recent.slice(0, 50));
      return [1, next];
    }
    if (name === "EXPIRE") return 1;
    throw new Error(`Unsupported fake Redis command: ${name}`);
  }

  beforeEach(() => {
    values.clear();
    lists.clear();
    delete process.env.LEDGERGUARD_STORAGE_BACKEND;
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    process.env.DEVELOPER_MAX_TENANTS = "2";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        const payload = JSON.parse(String(init?.body));
        const result =
          Array.isArray(payload[0])
            ? payload.map((command: Array<string | number>) => ({
                result: execute(command),
              }))
            : { result: execute(payload) };
        return {
          ok: true,
          status: 200,
          json: async () => result,
        };
      }),
    );
    resetTenantStoreForTests();
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DEVELOPER_MAX_TENANTS;
    vi.unstubAllGlobals();
    resetTenantStoreForTests();
  });

  it("persists tenant identity, usage, rotation, and payment replay state", async () => {
    const store = getTenantStore();
    expect(store).not.toBeNull();
    await expect(store!.health()).resolves.toBe(true);
    const registration = await store!.register("Redis Project");
    await expect(store!.authenticate("bad-key")).resolves.toBeNull();
    await expect(store!.authenticate(registration.apiKey)).resolves.toMatchObject(
      { id: registration.tenant.id },
    );
    await expect(
      store!.recordUsage(
        registration.tenant,
        "preflight",
        "redis-request",
        "redis-agent-testnet",
      ),
    ).resolves.toMatchObject({ used: 1, remaining: 999 });
    await expect(store!.usage(registration.tenant)).resolves.toMatchObject({
      used: 1,
      recent: [
        {
          integrationIdHash: `sha256:${createHash("sha256")
            .update("redis-agent-testnet")
            .digest("hex")}`,
        },
      ],
    });

    const replacement = await store!.rotateKey(
      registration.tenant,
      registration.apiKey,
    );
    await expect(store!.authenticate(registration.apiKey)).resolves.toBeNull();
    await expect(store!.authenticate(replacement)).resolves.toMatchObject({
      keyVersion: 2,
    });

    const payment = {
      requestId: "redis-payment",
      payer: "0x1111111111111111111111111111111111111111",
      settlementTransaction:
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      amountMicroUsdc: "1000",
      network: "arcTestnet" as const,
      recordedAt: "2026-07-30T00:00:00.000Z",
    };
    await expect(store!.recordPayment(payment)).resolves.toBe("recorded");
    await expect(store!.recordPayment(payment)).resolves.toBe("duplicate");
  });
});
