import { z } from "zod";

const sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/);
const caip2Schema = z
  .string()
  .regex(/^[a-z0-9-]{3,8}:[A-Za-z0-9-]{1,32}$/);

/**
 * Interoperable event shape for an opt-in data flywheel. The schema accepts
 * derived signals and digests only; raw addresses, calldata, purpose text,
 * wallet identifiers, and private keys are deliberately not fields.
 */
export const privacySafeTelemetrySchema = z
  .object({
    schemaVersion: z.literal("ledgerguard.telemetry.v1"),
    eventId: sha256Schema,
    occurredAt: z.iso.datetime(),
    consent: z.literal(true),
    network: caip2Schema,
    integrationIdHash: sha256Schema,
    intentDigest: sha256Schema,
    decision: z.enum(["ALLOW", "REVIEW", "BLOCK"]),
    signalCodes: z
      .array(z.string().regex(/^[A-Z0-9_]{1,100}$/))
      .max(100),
    outcome: z
      .enum([
        "UNKNOWN",
        "USER_CANCELLED",
        "SETTLED_MATCH",
        "SETTLED_MISMATCH",
        "CONFIRMED_FALSE_POSITIVE",
        "CONFIRMED_INCIDENT",
      ])
      .default("UNKNOWN"),
    evaluatorVersion: z.string().trim().min(1).max(64),
    privacy: z
      .object({
        containsRawAddress: z.literal(false),
        containsCalldata: z.literal(false),
        containsPurpose: z.literal(false),
      })
      .strict(),
  })
  .strict();

export type PrivacySafeTelemetry = z.infer<
  typeof privacySafeTelemetrySchema
>;
