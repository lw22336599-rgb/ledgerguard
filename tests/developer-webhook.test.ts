import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { deliverDeveloperWebhook } from "../src/services/developer-webhook.js";
import { resetTenantStoreForTests } from "../src/services/tenant-store.js";

describe("developer webhook", () => {
  beforeEach(() => {
    process.env.LEDGERGUARD_STORAGE_BACKEND = "memory";
    process.env.DEVELOPER_SELF_SERVICE_ENABLED = "true";
    process.env.DEVELOPER_WEBHOOK_ALLOWED_HOSTS = "example.test";
    resetTenantStoreForTests();
  });

  afterEach(() => {
    delete process.env.LEDGERGUARD_STORAGE_BACKEND;
    delete process.env.DEVELOPER_SELF_SERVICE_ENABLED;
    delete process.env.DEVELOPER_WEBHOOK_ALLOWED_HOSTS;
    resetTenantStoreForTests();
    vi.restoreAllMocks();
  });

  it("delivers HTTPS webhook payloads with request correlation headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", { status: 200 }),
    );
    const status = await deliverDeveloperWebhook("https://example.test/hook", {
      type: "preflight.completed",
      requestId: "req-123",
      integration: "webhook-test",
      occurredAt: new Date().toISOString(),
      result: { decision: "ALLOW" },
    });
    expect(status).toBe("delivered");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/hook",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-ledgerguard-event": "preflight.completed",
          "x-ledgerguard-request-id": "req-123",
        }),
      }),
    );
  });

  it("registers and clears a tenant webhook URL", async () => {
    const registration = await app.request("/v1/developer/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Webhook Tenant" }),
    });
    const { apiKey } = await registration.json();

    const updated = await app.request("/v1/developer/webhook", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url: "https://example.test/ledgerguard" }),
    });
    expect(updated.status).toBe(200);
    expect((await updated.json()).tenant.webhookUrl).toBe(
      "https://example.test/ledgerguard",
    );

    const cleared = await app.request("/v1/developer/webhook", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url: null }),
    });
    expect(cleared.status).toBe(200);
    expect((await cleared.json()).tenant.webhookUrl).toBeNull();
  });

  it("rejects non-HTTPS webhook URLs", async () => {
    const registration = await app.request("/v1/developer/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Bad Webhook Tenant" }),
    });
    const { apiKey } = await registration.json();

    const response = await app.request("/v1/developer/webhook", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url: "http://insecure.example/hook" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("INVALID_REQUEST");
  });

  it("rejects HTTPS destinations outside the operator allowlist", async () => {
    const registration = await app.request("/v1/developer/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Blocked Webhook Tenant" }),
    });
    const { apiKey } = await registration.json();
    const response = await app.request("/v1/developer/webhook", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url: "https://localhost.example/hook" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(
      "WEBHOOK_DESTINATION_NOT_ALLOWED",
    );
  });
});
