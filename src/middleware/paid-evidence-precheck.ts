import type { MiddlewareHandler } from "hono";
import { evidenceSchema } from "../schemas.js";
import {
  retrieveEvidence,
  TransactionNotFoundError,
} from "../services/evidence-retrieval.js";
import type { AppEnvironment } from "./request-telemetry.js";

/**
 * A discovery request must still receive the x402 challenge, but a signed
 * retry must never be settled before LedgerGuard knows that the requested
 * evidence can be delivered.
 */
export const paidEvidencePrecheck: MiddlewareHandler<AppEnvironment> = async (
  context,
  next,
) => {
  if (!context.req.header("payment-signature")) {
    await next();
    return;
  }

  const parsed = evidenceSchema.safeParse(
    await context.req.json().catch(() => null),
  );
  if (!parsed.success) {
    return context.json(
      { error: "INVALID_REQUEST", issues: parsed.error.issues },
      400,
    );
  }

  try {
    context.set("paidEvidence", await retrieveEvidence(parsed.data));
    await next();
  } catch (error) {
    if (error instanceof TransactionNotFoundError) {
      return context.json(
        { error: "TRANSACTION_NOT_FOUND", message: error.message },
        404,
      );
    }
    return context.json(
      {
        error: "EVIDENCE_UNAVAILABLE",
        message:
          "Strict evidence could not be prepared, so no payment was settled.",
      },
      503,
    );
  }
};
