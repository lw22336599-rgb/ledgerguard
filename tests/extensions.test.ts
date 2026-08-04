import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { runExtensionConformance } from "../src/extensions/conformance.js";
import { extensionManifestSchema } from "../src/extensions/manifest.js";
import { generatedExtensionManifests } from "../src/extensions/generated-registry.js";
import {
  extensionState,
  getExtensionRegistryHealth,
  listExtensionRegistry,
} from "../src/extensions/registry.js";
import {
  callRemoteAdapter,
  RemoteAdapterError,
} from "../src/extensions/remote-adapter.js";
import { evaluate } from "../examples/extensions/reference-policy-http/handler.js";

const manifestFile = JSON.parse(
  readFileSync(
    new URL(
      "../registry/extensions/ledgerguard.reference-policy-http.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

describe("Extension Manifest v1 and registry", () => {
  it("keeps the public manifest, source artifact, and runtime registry aligned", () => {
    expect(extensionManifestSchema.parse(manifestFile)).toEqual(
      extensionManifestSchema.parse(generatedExtensionManifests[0]),
    );
    const source = readFileSync(
      new URL(
        "../examples/extensions/reference-policy-http/handler.ts",
        import.meta.url,
      ),
    );
    const digest = `sha256:${createHash("sha256").update(source).digest("hex")}`;
    expect(manifestFile.artifact.digest).toBe(digest);
    expect(runExtensionConformance(manifestFile).passed).toBe(true);
  });

  it("rejects unpinned, insecure, or expired manifests", () => {
    const insecure = structuredClone(manifestFile);
    insecure.source.commit = "main";
    insecure.runtime.endpoint = "http://example.com/adapter";
    expect(extensionManifestSchema.safeParse(insecure).success).toBe(false);
    expect(
      runExtensionConformance(
        manifestFile,
        new Date("2027-02-05T00:00:00.000Z"),
    ).passed,
    ).toBe(false);
  });

  it("enforces lifecycle, pricing, and loopback endpoint rules", () => {
    const invalidLifecycle = structuredClone(manifestFile);
    invalidLifecycle.lifecycle.expiresAt = invalidLifecycle.lifecycle.publishedAt;
    expect(extensionManifestSchema.safeParse(invalidLifecycle).success).toBe(false);

    const missingPricingUrl = structuredClone(manifestFile);
    missingPricingUrl.pricing = { model: "author-hosted" };
    expect(extensionManifestSchema.safeParse(missingPricingUrl).success).toBe(false);

    const loopback = structuredClone(manifestFile);
    loopback.runtime.endpoint = "http://127.0.0.1:8787/evaluate";
    expect(extensionManifestSchema.safeParse(loopback).success).toBe(true);
  });

  it("reports active and expired lifecycle state without deleting audit history", () => {
    const [entry] = listExtensionRegistry(new Date("2026-08-05T01:00:00.000Z"));
    expect(entry?.state).toBe("active");
    expect(
      extensionState(
        { manifest: manifestFile, revokedAt: null, revocationReason: null },
        new Date("2027-02-05T00:00:00.000Z"),
      ),
    ).toBe("expired");
    expect(
      extensionState({
        manifest: manifestFile,
        revokedAt: "2026-08-05T02:00:00.000Z",
        revocationReason: "Security incident",
      }),
    ).toBe("revoked");
    expect(getExtensionRegistryHealth().ok).toBe(true);
  });
});

describe("Isolated remote adapter contract", () => {
  it("accepts a bounded response with the same request ID", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          schemaVersion: "ledgerguard.adapter-response.v1",
          requestId: body.requestId,
          status: "REVIEW",
          findings: [{ code: "REFERENCE_ONLY", message: "Human review required" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const result = await callRemoteAdapter(manifestFile, { intent: "demo" }, { fetcher });
    expect(result.status).toBe("REVIEW");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("keeps the reference adapter non-authoritative", () => {
    expect(
      evaluate({
        schemaVersion: "ledgerguard.adapter-request.v1",
        requestId: "request-1",
        extension: "ledgerguard.reference-policy-http@1.0.0",
        capability: "policy-pack",
        payload: {},
      }),
    ).toMatchObject({ requestId: "request-1", status: "REVIEW" });
  });

  it.each([
    ["HTTP failure", async () => new Response("down", { status: 503 })],
    [
      "invalid JSON",
      async () => new Response("not-json", { status: 200 }),
    ],
    [
      "request ID mismatch",
      async () =>
        Response.json({
          schemaVersion: "ledgerguard.adapter-response.v1",
          requestId: "00000000-0000-4000-8000-000000000000",
          status: "OK",
          findings: [],
        }),
    ],
  ])("fails closed on %s", async (_name, fetcher) => {
    await expect(
      callRemoteAdapter(manifestFile, {}, { fetcher }),
    ).rejects.toBeInstanceOf(RemoteAdapterError);
  });

  it("rejects responses beyond the declared byte budget", async () => {
    const fetcher = async () =>
      new Response("{}", {
        status: 200,
        headers: { "content-length": "70000" },
      });
    await expect(
      callRemoteAdapter(manifestFile, {}, { fetcher }),
    ).rejects.toThrow("exceeds declared byte limit");
  });

  it("rejects oversized requests before network access", async () => {
    const fetcher = vi.fn();
    await expect(
      callRemoteAdapter(manifestFile, { intent: "x".repeat(70_000) }, { fetcher }),
    ).rejects.toThrow("request exceeds declared byte limit");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("blocks undeclared and private payload fields before network access", async () => {
    const fetcher = vi.fn();
    await expect(
      callRemoteAdapter(manifestFile, { simulation: { ok: true } }, { fetcher }),
    ).rejects.toThrow("not permitted to receive simulation");
    await expect(
      callRemoteAdapter(manifestFile, { privateKey: "never" }, { fetcher }),
    ).rejects.toThrow("unsupported or private data fields");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("times out and never retries a failed adapter call", async () => {
    const timedManifest = structuredClone(manifestFile);
    timedManifest.runtime.timeoutMs = 100;
    const fetcher = vi.fn((_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Timed out", "TimeoutError")), {
          once: true,
        });
      }),
    );
    await expect(
      callRemoteAdapter(timedManifest, { intent: {} }, { fetcher }),
    ).rejects.toThrow("Adapter transport failed");
    expect(fetcher).toHaveBeenCalledOnce();
  });
});

describe("Extension public API", () => {
  it("publishes the registry, schema, health, metadata, and OpenAPI paths", async () => {
    const registry = await app.request("/v1/extensions");
    expect(registry.status).toBe(200);
    const registryBody = await registry.json();
    expect(registryBody.entries[0]).toMatchObject({
      state: "active",
      manifest: { id: "ledgerguard.reference-policy-http" },
    });

    const health = await app.request("/v1/extensions/health");
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ ok: true, active: 1 });

    const schema = await app.request("/schemas/extension-manifest-v1.json");
    expect(schema.status).toBe(200);
    expect(await schema.json()).toMatchObject({
      title: "LedgerGuard Extension Manifest v1",
    });
    const intentSchema = await app.request("/schemas/control-intent-v2.json");
    expect(intentSchema.status).toBe(200);
    expect(await intentSchema.json()).toMatchObject({
      title: "LedgerGuard Control Intent v2",
    });

    const meta = await (await app.request("/v1/meta")).json();
    expect(meta.extensions).toBe("/v1/extensions");
    const openapi = await (await app.request("/openapi.json")).json();
    expect(openapi.paths["/v1/extensions"]).toBeDefined();
    expect(openapi.paths["/schemas/control-intent-v2.json"]).toBeDefined();
  });
});
