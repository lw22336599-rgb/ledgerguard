export type PreflightDecision = "ALLOW" | "REVIEW" | "BLOCK";

export type PreflightRequest = {
  network?: "arcTestnet" | "arcMainnet" | "baseMainnet";
  from?: string;
  to: string;
  data?: string;
  valueWei?: string;
  intent: {
    action: "transfer" | "approve" | "contract_call";
    expectedDebitAddress?: string;
    expectedRecipient?: string;
    expectedAssetAddress?: string;
    expectedAmountMicroUsdc?: string;
    purpose: string;
  };
  policy?: {
    allowedTargets?: string[];
    maxAmountMicroUsdc?: string;
    allowUnlimitedApproval?: boolean;
    requireSimulation?: boolean;
  };
};

export type CanSignRequest = {
  network?: "arcTestnet" | "arcMainnet" | "baseMainnet";
  from?: string;
  to: string;
  data?: string;
  valueWei?: string;
  recipient: string;
  amountMicroUsdc: string;
  purpose: string;
  assetAddress?: string;
  payer?: string;
  maxAmountMicroUsdc?: string;
  requireSimulation?: boolean;
};

export type PreflightResponse = {
  decision: PreflightDecision;
  [key: string]: unknown;
};

export type EvidenceRequest = {
  network?: "arcTestnet" | "arcMainnet" | "baseMainnet";
  txHash: string;
  intent: PreflightRequest["intent"];
};

export type EvidenceResponse = {
  status: "VERIFIED" | "MISMATCH" | "REVERTED" | "REVIEW";
  evidenceHash: string;
  [key: string]: unknown;
};

export type LedgerGuardClientOptions = {
  baseUrl?: string;
  apiKey?: string;
  integration?: string;
  clientVersion?: string;
  fetcher?: typeof fetch;
};

type ErrorBody = {
  error?: string;
  message?: string;
  [key: string]: unknown;
};

export class LedgerGuardHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorBody;

  constructor(status: number, body: ErrorBody) {
    super(body.message ?? body.error ?? `LedgerGuard request failed (${status}).`);
    this.name = "LedgerGuardHttpError";
    this.status = status;
    this.code = body.error ?? "LEDGERGUARD_HTTP_ERROR";
    this.details = body;
  }
}

export class LedgerGuardClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly integration: string | undefined;
  private readonly clientVersion: string;
  private readonly fetcher: typeof fetch;

  constructor(options: LedgerGuardClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://ledgerguard-gules.vercel.app")
      .replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.integration = options.integration;
    this.clientVersion = options.clientVersion ?? "ledgerguard-sdk/0.1.1";
    this.fetcher = options.fetcher ?? fetch;
  }

  preflight(input: PreflightRequest): Promise<PreflightResponse> {
    return this.post<PreflightResponse>(
      this.apiKey ? "/v1/developer/preflight" : "/v1/preflight",
      input,
    );
  }

  canSign(input: CanSignRequest): Promise<PreflightResponse> {
    return this.post<PreflightResponse>("/v1/can-sign", input);
  }

  evidence(input: EvidenceRequest): Promise<EvidenceResponse> {
    return this.post<EvidenceResponse>("/v1/evidence", input);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-ledgerguard-client": this.clientVersion,
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    if (this.integration) {
      headers["x-ledgerguard-integration"] = this.integration;
    }
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({
      error: "INVALID_RESPONSE",
      message: "LedgerGuard returned a non-JSON response.",
    }))) as T | ErrorBody;
    if (!response.ok) {
      throw new LedgerGuardHttpError(response.status, payload as ErrorBody);
    }
    return payload as T;
  }
}

export type WithPreflightOptions = {
  client?: LedgerGuardClient;
  baseUrl?: string;
  apiKey?: string;
  integration?: string;
  buildInput: (context: { requestId?: string }) => PreflightRequest | CanSignRequest;
  useCanSign?: boolean;
  onDecision?: (
    decision: PreflightResponse,
    context: { requestId?: string },
  ) => void | Promise<void>;
  failOnReview?: boolean;
};

export type PreflightGuardResult<T> = {
  decision: PreflightResponse;
  requestId?: string;
  value: T;
};

function requestIdFromHeaders(headers: Headers): string | undefined {
  return headers.get("x-ledgerguard-request-id") ?? undefined;
}

export async function withPreflight<T>(
  options: WithPreflightOptions,
  run: () => Promise<T>,
): Promise<PreflightGuardResult<T>> {
  const client =
    options.client ??
    new LedgerGuardClient({
      ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
      ...(options.apiKey ? { apiKey: options.apiKey } : {}),
      ...(options.integration ? { integration: options.integration } : {}),
    });
  const input = options.buildInput({});
  const decision = options.useCanSign
    ? await client.canSign(input as CanSignRequest)
    : await client.preflight(input as PreflightRequest);

  if (options.onDecision) {
    await options.onDecision(decision, {});
  }

  if (decision.decision === "BLOCK") {
    throw new LedgerGuardHttpError(403, {
      error: "PREFLIGHT_BLOCK",
      message: "LedgerGuard blocked this transaction before execution.",
      decision,
    });
  }
  if (decision.decision === "REVIEW" && options.failOnReview !== false) {
    throw new LedgerGuardHttpError(409, {
      error: "PREFLIGHT_REVIEW",
      message: "LedgerGuard requires human review before execution.",
      decision,
    });
  }

  const value = await run();
  return { decision, value };
}

export async function preflightFetch(
  client: LedgerGuardClient,
  input: PreflightRequest | CanSignRequest,
  init: RequestInit & { url: string },
  options: { useCanSign?: boolean } = {},
): Promise<Response> {
  const decision = options.useCanSign
    ? await client.canSign(input as CanSignRequest)
    : await client.preflight(input as PreflightRequest);

  if (decision.decision !== "ALLOW") {
    return new Response(
      JSON.stringify({
        error:
          decision.decision === "BLOCK"
            ? "PREFLIGHT_BLOCK"
            : "PREFLIGHT_REVIEW",
        decision,
      }),
      {
        status: decision.decision === "BLOCK" ? 403 : 409,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const response = await fetch(init.url, init);
  const requestId = requestIdFromHeaders(response.headers);
  if (requestId) {
    response.headers.set("x-ledgerguard-preflight-request-id", requestId);
  }
  return response;
}
