import {
  LedgerGuardClient,
  LedgerGuardHttpError,
  type CanSignRequest,
  type PreflightResponse,
} from "./client.js";
import type { PreflightInput } from "../schemas.js";

export type WithPreflightOptions = {
  client?: LedgerGuardClient;
  baseUrl?: string;
  apiKey?: string;
  integration?: string;
  buildInput: () => PreflightInput | CanSignRequest;
  useCanSign?: boolean;
  onDecision?: (decision: PreflightResponse) => void | Promise<void>;
  failOnReview?: boolean;
};

export type PreflightGuardResult<T> = {
  decision: PreflightResponse;
  value: T;
};

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
  const input = options.buildInput();
  const decision = options.useCanSign
    ? await client.canSign(input as CanSignRequest)
    : await client.preflight(input as PreflightInput);

  if (options.onDecision) {
    await options.onDecision(decision);
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

  return { decision, value: await run() };
}

export async function preflightFetch(
  client: LedgerGuardClient,
  input: PreflightInput | CanSignRequest,
  init: RequestInit & { url: string },
  options: { useCanSign?: boolean } = {},
): Promise<Response> {
  const decision = options.useCanSign
    ? await client.canSign(input as CanSignRequest)
    : await client.preflight(input as PreflightInput);

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

  return fetch(init.url, init);
}
