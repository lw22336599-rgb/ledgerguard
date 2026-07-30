import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
    expect((await preflight.json()).usage.used).toBe(1);

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
