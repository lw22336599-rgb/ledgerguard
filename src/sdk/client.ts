import type { EvidenceInput, PreflightInput } from "../schemas.js";

export type LedgerGuardClientOptions = {
  baseUrl?: string;
  apiKey?: string;
  fetcher?: typeof fetch;
};

export type PreflightResponse = {
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  [key: string]: unknown;
};

export type ShadowResponse = {
  mode: "shadow";
  enforced: false;
  wouldDecision: "ALLOW" | "REVIEW" | "BLOCK";
  signingEnabled: false;
  custody: "none";
  [key: string]: unknown;
};

export type EvidenceResponse = {
  status: "VERIFIED" | "MISMATCH" | "REVERTED" | "REVIEW";
  evidenceHash: string;
  [key: string]: unknown;
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

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
    };
  }
}

export class LedgerGuardClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly fetcher: typeof fetch;

  constructor(options: LedgerGuardClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://ledgerguard-gules.vercel.app")
      .replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.fetcher = options.fetcher ?? fetch;
  }

  preflight(input: PreflightInput): Promise<PreflightResponse> {
    return this.post<PreflightResponse>(
      this.apiKey ? "/v1/developer/preflight" : "/v1/preflight",
      input,
    );
  }

  shadow(input: PreflightInput): Promise<ShadowResponse> {
    if (!this.apiKey) {
      throw new Error("LedgerGuard shadow mode requires an API key.");
    }
    return this.post<ShadowResponse>("/v1/developer/shadow", input);
  }

  evidence(input: EvidenceInput): Promise<EvidenceResponse> {
    return this.post<EvidenceResponse>("/v1/evidence", input);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-ledgerguard-client": "ledgerguard-ts/0.1.0",
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
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
