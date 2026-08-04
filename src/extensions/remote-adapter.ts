import { randomUUID } from "node:crypto";
import { z } from "zod";
import { extensionManifestSchema, type ExtensionManifest } from "./manifest.js";

const adapterResponseSchema = z.object({
  schemaVersion: z.literal("ledgerguard.adapter-response.v1"),
  requestId: z.uuid(),
  status: z.enum(["OK", "REVIEW", "BLOCK", "ERROR"]),
  output: z.unknown().optional(),
  findings: z
    .array(z.object({ code: z.string().min(1).max(100), message: z.string().min(1).max(500) }))
    .max(100)
    .default([]),
});

const adapterPayloadSchema = z
  .object({
    intent: z.unknown().optional(),
    policy: z.unknown().optional(),
    simulation: z.unknown().optional(),
    publicChainEvidence: z.unknown().optional(),
  })
  .strict();

const payloadPermissionByKey = {
  intent: "intent",
  policy: "policy",
  simulation: "simulation",
  publicChainEvidence: "public-chain-evidence",
} as const;

export type RemoteAdapterResponse = z.infer<typeof adapterResponseSchema>;

export class RemoteAdapterError extends Error {
  readonly code = "REMOTE_ADAPTER_FAILED";
  constructor(message: string) {
    super(message);
    this.name = "RemoteAdapterError";
  }
}

export async function callRemoteAdapter(
  rawManifest: ExtensionManifest,
  payload: Record<string, unknown>,
  options: { fetcher?: typeof fetch; requestId?: string } = {},
): Promise<RemoteAdapterResponse> {
  const manifest = extensionManifestSchema.parse(rawManifest);
  const parsedPayload = adapterPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    throw new RemoteAdapterError("Adapter payload contains unsupported or private data fields");
  }
  const allowedData = new Set(manifest.runtime.permissions.data);
  for (const key of Object.keys(parsedPayload.data) as Array<keyof typeof payloadPermissionByKey>) {
    if (parsedPayload.data[key] !== undefined && !allowedData.has(payloadPermissionByKey[key])) {
      throw new RemoteAdapterError(`Adapter is not permitted to receive ${payloadPermissionByKey[key]}`);
    }
  }
  const requestId = options.requestId ?? randomUUID();
  const fetcher = options.fetcher ?? fetch;
  const body = JSON.stringify({
    schemaVersion: "ledgerguard.adapter-request.v1",
    requestId,
    extension: `${manifest.id}@${manifest.version}`,
    capability: manifest.capability,
    payload: parsedPayload.data,
  });
  if (new TextEncoder().encode(body).byteLength > manifest.runtime.maxRequestBytes) {
    throw new RemoteAdapterError("Adapter request exceeds declared byte limit");
  }
  let response: Response;
  try {
    response = await fetcher(manifest.runtime.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ledgerguard-adapter-contract": "1",
      },
      body,
      signal: AbortSignal.timeout(manifest.runtime.timeoutMs),
    });
  } catch (error) {
    throw new RemoteAdapterError(
      error instanceof Error ? `Adapter transport failed: ${error.name}` : "Adapter transport failed",
    );
  }
  if (!response.ok) throw new RemoteAdapterError(`Adapter returned HTTP ${response.status}`);
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > manifest.runtime.maxResponseBytes) {
    throw new RemoteAdapterError("Adapter response exceeds declared byte limit");
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > manifest.runtime.maxResponseBytes) {
    throw new RemoteAdapterError("Adapter response exceeds declared byte limit");
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch {
    throw new RemoteAdapterError("Adapter returned invalid JSON");
  }
  const parsed = adapterResponseSchema.safeParse(decoded);
  if (!parsed.success) throw new RemoteAdapterError("Adapter returned an invalid contract response");
  if (parsed.data.requestId !== requestId) throw new RemoteAdapterError("Adapter response requestId mismatch");
  return parsed.data;
}
