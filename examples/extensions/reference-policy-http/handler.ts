export type AdapterRequest = {
  schemaVersion: "ledgerguard.adapter-request.v1";
  requestId: string;
  extension: string;
  capability: string;
  payload: unknown;
};

export type AdapterResponse = {
  schemaVersion: "ledgerguard.adapter-response.v1";
  requestId: string;
  status: "OK" | "REVIEW" | "BLOCK" | "ERROR";
  output?: unknown;
  findings: Array<{ code: string; message: string }>;
};

/**
 * Reference-only handler. A real author hosts this outside LedgerGuard and must
 * implement authentication, rate limits, replay controls, and observability.
 */
export function evaluate(request: AdapterRequest): AdapterResponse {
  return {
    schemaVersion: "ledgerguard.adapter-response.v1",
    requestId: request.requestId,
    status: "REVIEW",
    findings: [
      {
        code: "REFERENCE_ONLY",
        message: "The reference adapter never authorizes a transaction.",
      },
    ],
  };
}
