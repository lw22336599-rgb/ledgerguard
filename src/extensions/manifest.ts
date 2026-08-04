import { z } from "zod";

const stableId = z
  .string()
  .trim()
  .min(3)
  .max(128)
  .regex(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/, "Expected a stable lowercase identifier");
const semver = z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "Expected semantic version");
const caip2 = z.string().regex(/^[a-z0-9-]{3,8}:[A-Za-z0-9-]{1,32}$/, "Expected CAIP-2 identifier");
const caip19 = z
  .string()
  .regex(/^[a-z0-9-]{3,8}:[A-Za-z0-9-]{1,32}\/[A-Za-z0-9-]{1,32}:[A-Za-z0-9.%_-]{1,128}$/, "Expected CAIP-19 identifier");
const httpsUrl = z.url().refine((value) => new URL(value).protocol === "https:", "Expected HTTPS URL");
const digest = z.string().regex(/^sha256:[0-9a-f]{64}$/, "Expected sha256 digest");
const sourceCommit = z.string().regex(/^[0-9a-f]{40}$/, "Source commit must be a full 40-character Git hash");

export const extensionCapabilitySchema = z.enum([
  "network",
  "asset",
  "protocol",
  "wallet",
  "identity",
  "policy-pack",
  "evidence-exporter",
]);

export const extensionMaturitySchema = z.enum([
  "community",
  "self-tested",
  "conformant",
  "production-candidate",
]);

export const extensionManifestSchema = z
  .object({
    schemaVersion: z.literal("ledgerguard.extension.v1"),
    id: stableId,
    name: z.string().trim().min(3).max(100),
    version: semver,
    license: z.string().trim().min(2).max(64),
    author: z.object({
      name: z.string().trim().min(2).max(100),
      url: httpsUrl.optional(),
    }),
    source: z.object({
      repository: httpsUrl,
      commit: sourceCommit,
      path: z.string().trim().min(1).max(256).optional(),
    }),
    artifact: z.object({
      digest,
      path: z.string().trim().min(1).max(256),
    }),
    capability: extensionCapabilitySchema,
    compatibility: z.object({
      ledgerguardApi: z.literal("1"),
      networks: z.array(caip2).max(100).default([]),
      assets: z.array(caip19).max(500).default([]),
      protocols: z.array(stableId).max(100).default([]),
    }),
    runtime: z.object({
      mode: z.literal("remote-http"),
      endpoint: z.url(),
      timeoutMs: z.number().int().min(100).max(5_000).default(2_000),
      maxRequestBytes: z.number().int().min(1_024).max(1_048_576).default(65_536),
      maxResponseBytes: z.number().int().min(1_024).max(1_048_576).default(65_536),
      permissions: z.object({
        outboundHosts: z.array(z.hostname()).max(20).default([]),
        data: z
          .array(z.enum(["intent", "policy", "simulation", "public-chain-evidence"]))
          .min(1)
          .max(4),
      }),
    }),
    lifecycle: z.object({
      maturity: extensionMaturitySchema,
      publishedAt: z.iso.datetime(),
      expiresAt: z.iso.datetime(),
      maintainer: z.string().trim().min(2).max(100),
      supportUrl: httpsUrl,
    }),
    knownLimitations: z.array(z.string().trim().min(3).max(280)).max(20).default([]),
    pricing: z
      .object({
        model: z.enum(["free", "author-hosted"]),
        url: httpsUrl.optional(),
      })
      .optional(),
  })
  .superRefine((manifest, context) => {
    const endpoint = new URL(manifest.runtime.endpoint);
    const loopback = endpoint.hostname === "127.0.0.1" || endpoint.hostname === "localhost";
    if (endpoint.protocol !== "https:" && !(loopback && endpoint.protocol === "http:")) {
      context.addIssue({
        code: "custom",
        path: ["runtime", "endpoint"],
        message: "Remote adapters require HTTPS; HTTP is allowed only for loopback development",
      });
    }
    if (Date.parse(manifest.lifecycle.expiresAt) <= Date.parse(manifest.lifecycle.publishedAt)) {
      context.addIssue({
        code: "custom",
        path: ["lifecycle", "expiresAt"],
        message: "expiresAt must be later than publishedAt",
      });
    }
    if (manifest.pricing?.model === "author-hosted" && !manifest.pricing.url) {
      context.addIssue({
        code: "custom",
        path: ["pricing", "url"],
        message: "Author-hosted pricing requires an HTTPS pricing URL",
      });
    }
  });

export type ExtensionManifest = z.infer<typeof extensionManifestSchema>;
export type ExtensionCapability = z.infer<typeof extensionCapabilitySchema>;
export type ExtensionMaturity = z.infer<typeof extensionMaturitySchema>;

export const extensionManifestJsonSchema = {
  ...z.toJSONSchema(extensionManifestSchema),
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://ledgerguard-gules.vercel.app/schemas/extension-manifest-v1.json",
  title: "LedgerGuard Extension Manifest v1",
  description:
    "Contract for isolated, externally hosted LedgerGuard extensions. Cross-field HTTPS, lifecycle, and pricing constraints are additionally enforced by the conformance runner.",
} as const;
