import { extensionManifestSchema, type ExtensionManifest } from "./manifest.js";

export type ConformanceCheck = { id: string; passed: boolean; message: string };

export function runExtensionConformance(raw: unknown, now = new Date()) {
  const parsed = extensionManifestSchema.safeParse(raw);
  const checks: ConformanceCheck[] = [];
  checks.push({
    id: "manifest.schema",
    passed: parsed.success,
    message: parsed.success ? "Manifest matches Extension Manifest v1." : "Manifest schema validation failed.",
  });
  if (!parsed.success) {
    return {
      schemaVersion: "ledgerguard.conformance-report.v1" as const,
      passed: false,
      extension: null,
      checkedAt: now.toISOString(),
      checks,
      issues: parsed.error.issues,
    };
  }
  const manifest: ExtensionManifest = parsed.data;
  checks.push({
    id: "source.pinned",
    passed: /^[0-9a-f]{40}$/.test(manifest.source.commit),
    message: "Source is pinned to a full Git commit.",
  });
  checks.push({
    id: "artifact.digest",
    passed: /^sha256:[0-9a-f]{64}$/.test(manifest.artifact.digest),
    message: "Artifact declares a SHA-256 digest.",
  });
  const active = Date.parse(manifest.lifecycle.expiresAt) > now.getTime();
  checks.push({
    id: "lifecycle.active",
    passed: active,
    message: active ? "Manifest has not expired." : "Manifest is expired.",
  });
  checks.push({
    id: "runtime.isolated",
    passed: manifest.runtime.mode === "remote-http",
    message: "Extension runs outside the LedgerGuard production process.",
  });
  return {
    schemaVersion: "ledgerguard.conformance-report.v1" as const,
    passed: checks.every((check) => check.passed),
    extension: `${manifest.id}@${manifest.version}`,
    checkedAt: now.toISOString(),
    checks,
    issues: [],
  };
}
