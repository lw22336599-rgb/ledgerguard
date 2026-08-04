import { createHash } from "node:crypto";
import { z } from "zod";

const identifierSchema = z
  .string()
  .trim()
  .min(3)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "Expected a stable identifier");

const caip2Schema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{3,8}:[A-Za-z0-9-]{1,32}$/, "Expected a CAIP-2 network identifier");

const uintStringSchema = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/, "Expected an unsigned integer string");

const operationSchema = z.object({
  kind: z.enum(["payment", "approval", "contract_call"]),
  network: caip2Schema,
  from: z.string().trim().min(1).max(256).optional(),
  to: z.string().trim().min(1).max(256).optional(),
  asset: z.string().trim().min(1).max(256).optional(),
  amountAtomic: uintStringSchema.optional(),
  purpose: z.string().trim().min(1).max(280),
});

export const controlIntentSchema = z
  .object({
    schemaVersion: z.literal("ledgerguard.intent.v1"),
    id: identifierSchema,
    createdAt: z.iso.datetime(),
    expiresAt: z.iso.datetime().optional(),
    actor: z.object({
      kind: z.enum(["human", "agent", "service"]),
      id: identifierSchema,
    }),
    operation: operationSchema,
    source: z
      .object({
        protocol: z.enum(["x402", "ap2", "acp", "a2a", "mcp", "custom"]),
        reference: z.string().trim().min(1).max(256).optional(),
      })
      .optional(),
  })
  .superRefine((intent, context) => {
    if (intent.expiresAt && Date.parse(intent.expiresAt) <= Date.parse(intent.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "expiresAt must be later than createdAt",
      });
    }

    if (intent.operation.kind === "contract_call") {
      if (!intent.operation.to) {
        context.addIssue({ code: "custom", path: ["operation", "to"], message: "to is required for contract_call" });
      }
      return;
    }

    for (const field of ["to", "asset", "amountAtomic"] as const) {
      if (!intent.operation[field]) {
        context.addIssue({
          code: "custom",
          path: ["operation", field],
          message: `${field} is required for ${intent.operation.kind}`,
        });
      }
    }

    if (intent.operation.kind === "payment" && intent.operation.amountAtomic === "0") {
      context.addIssue({
        code: "custom",
        path: ["operation", "amountAtomic"],
        message: "Payment amount must be greater than zero",
      });
    }
  });

export const controlPolicySchema = z.object({
  schemaVersion: z.literal("ledgerguard.policy.v1"),
  id: identifierSchema,
  allowedNetworks: z.array(caip2Schema).min(1).max(100),
  allowedAssets: z.array(z.string().trim().min(1).max(256)).max(500).optional(),
  allowedRecipients: z.array(z.string().trim().min(1).max(256)).max(500).optional(),
  maxAmountByAsset: z.record(z.string().trim().min(1).max(256), uintStringSchema).optional(),
  requireSimulation: z.boolean().default(true),
  requireEvidence: z.boolean().default(true),
});

const findingSchema = z.object({
  code: z.string().trim().min(1).max(100).regex(/^[A-Z0-9_]+$/),
  severity: z.enum(["info", "warning", "critical"]),
  message: z.string().trim().min(1).max(500),
});

export const controlDecisionSchema = z.object({
  schemaVersion: z.literal("ledgerguard.decision.v1"),
  id: identifierSchema,
  intentId: identifierSchema,
  policyId: identifierSchema,
  evaluatedAt: z.iso.datetime(),
  evaluator: z.object({
    name: identifierSchema,
    version: z.string().trim().min(1).max(64),
  }),
  decision: z.enum(["ALLOW", "REVIEW", "BLOCK"]),
  findings: z.array(findingSchema).max(500),
});

export const controlReceiptSchema = z.object({
  schemaVersion: z.literal("ledgerguard.receipt.v1"),
  id: identifierSchema,
  intentId: identifierSchema,
  observedAt: z.iso.datetime(),
  network: caip2Schema,
  transactionId: z.string().trim().min(1).max(256),
  status: z.enum(["VERIFIED", "MISMATCH", "INCOMPLETE"]),
  evidenceHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
});

function stableJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Canonical JSON cannot contain non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  throw new TypeError(`Canonical JSON does not support ${typeof value}`);
}

export function canonicalDigest(value: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(stableJson(value), "utf8").digest("hex")}`;
}

export type ControlIntent = z.infer<typeof controlIntentSchema>;
export type ControlPolicy = z.infer<typeof controlPolicySchema>;
export type ControlDecision = z.infer<typeof controlDecisionSchema>;
export type ControlReceipt = z.infer<typeof controlReceiptSchema>;
