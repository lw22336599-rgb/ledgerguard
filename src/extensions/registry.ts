import { z } from "zod";
import { extensionManifestSchema, type ExtensionManifest } from "./manifest.js";
import {
  generatedExtensionManifests,
  generatedExtensionRevocations,
} from "./generated-registry.js";

export type ExtensionRegistryEntry = {
  manifest: ExtensionManifest;
  revokedAt: string | null;
  revocationReason: string | null;
};

const sourceManifests: readonly unknown[] = generatedExtensionManifests;
const sourceRevocations: readonly unknown[] = generatedExtensionRevocations;
const revocationSchema = z.object({
  extension: z.string().regex(/^[a-z0-9._-]+@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  revokedAt: z.iso.datetime(),
  reason: z.string().trim().min(3).max(500),
});

export type PublicExtensionEntry = ExtensionRegistryEntry & {
  state: "active" | "expired" | "revoked";
};

export function extensionState(
  entry: ExtensionRegistryEntry,
  now = new Date(),
): PublicExtensionEntry["state"] {
  if (entry.revokedAt) return "revoked";
  return Date.parse(entry.manifest.lifecycle.expiresAt) <= now.getTime() ? "expired" : "active";
}

export function listExtensionRegistry(now = new Date()): PublicExtensionEntry[] {
  const seen = new Set<string>();
  const revocations = z.array(revocationSchema).parse(sourceRevocations);
  const revocationMap = new Map<string, z.infer<typeof revocationSchema>>();
  for (const revocation of revocations) {
    if (revocationMap.has(revocation.extension)) {
      throw new Error(`Duplicate extension revocation: ${revocation.extension}`);
    }
    revocationMap.set(revocation.extension, revocation);
  }
  const entries = sourceManifests.map((rawManifest) => {
    const manifest = extensionManifestSchema.parse(rawManifest);
    const key = `${manifest.id}@${manifest.version}`;
    if (seen.has(key)) throw new Error(`Duplicate extension registry entry: ${key}`);
    seen.add(key);
    const revocation = revocationMap.get(key);
    const entry: ExtensionRegistryEntry = {
      manifest,
      revokedAt: revocation?.revokedAt ?? null,
      revocationReason: revocation?.reason ?? null,
    };
    return { ...entry, state: extensionState(entry, now) };
  });
  for (const extension of revocationMap.keys()) {
    if (!seen.has(extension)) throw new Error(`Orphan extension revocation: ${extension}`);
  }
  return entries;
}

export function getExtensionRegistryHealth(now = new Date()) {
  try {
    const entries = listExtensionRegistry(now);
    const active = entries.filter((entry) => entry.state === "active").length;
    const expired = entries.filter((entry) => entry.state === "expired").length;
    const revoked = entries.filter((entry) => entry.state === "revoked").length;
    return {
      ok: true as const,
      schemaVersion: "ledgerguard.extension-registry.v1" as const,
      total: entries.length,
      active,
      expired,
      revoked,
      checkedAt: now.toISOString(),
    };
  } catch (error) {
    return {
      ok: false as const,
      schemaVersion: "ledgerguard.extension-registry.v1" as const,
      error: "EXTENSION_REGISTRY_INVALID" as const,
      message: error instanceof Error ? error.message.slice(0, 300) : "Unknown registry error",
      checkedAt: now.toISOString(),
    };
  }
}
