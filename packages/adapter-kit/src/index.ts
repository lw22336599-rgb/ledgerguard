export const EXTENSION_CAPABILITIES = [
  "network",
  "asset",
  "protocol",
  "wallet",
  "identity",
  "policy-pack",
  "evidence-exporter",
] as const;

export type ExtensionCapability = (typeof EXTENSION_CAPABILITIES)[number];
export type AdapterStatus = "OK" | "REVIEW" | "BLOCK" | "ERROR";

export type AdapterRequest<T = unknown> = {
  schemaVersion: "ledgerguard.adapter-request.v1";
  requestId: string;
  extension: string;
  capability: ExtensionCapability;
  payload: T;
};

export type AdapterResponse<T = unknown> = {
  schemaVersion: "ledgerguard.adapter-response.v1";
  requestId: string;
  status: AdapterStatus;
  output?: T;
  findings: Array<{ code: string; message: string }>;
};

export type ExtensionManifest = {
  schemaVersion: "ledgerguard.extension.v1";
  id: string;
  name: string;
  version: string;
  license: string;
  author: { name: string; url?: string };
  source: { repository: string; commit: string; path?: string };
  artifact: { digest: `sha256:${string}`; path: string };
  capability: ExtensionCapability;
  compatibility: {
    ledgerguardApi: "1";
    networks: string[];
    assets: string[];
    protocols: string[];
  };
  runtime: {
    mode: "remote-http";
    endpoint: string;
    timeoutMs: number;
    maxRequestBytes: number;
    maxResponseBytes: number;
    permissions: {
      outboundHosts: string[];
      data: Array<"intent" | "policy" | "simulation" | "public-chain-evidence">;
    };
  };
  lifecycle: {
    maturity: "community" | "self-tested" | "conformant" | "production-candidate";
    publishedAt: string;
    expiresAt: string;
    maintainer: string;
    supportUrl: string;
  };
  knownLimitations: string[];
  pricing?: { model: "free" | "author-hosted"; url?: string };
};

export function defineExtension<const T extends ExtensionManifest>(manifest: T): T {
  return manifest;
}
