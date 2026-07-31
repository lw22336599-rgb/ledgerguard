import { isAddress, isHex } from "viem";
import { z } from "zod";

const addressSchema = z
  .string()
  .refine(isAddress, "Expected a valid EVM address");

const hexSchema = z
  .string()
  .refine((value) => isHex(value), "Expected 0x-prefixed hex data");

const uintStringSchema = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/, "Expected an unsigned integer string");

export const networkNameSchema = z.enum([
  "arcTestnet",
  "arcMainnet",
  "baseMainnet",
]);

const intentSchema = z
  .object({
    action: z.enum(["transfer", "approve", "contract_call"]),
    expectedDebitAddress: addressSchema.optional(),
    expectedRecipient: addressSchema.optional(),
    expectedAssetAddress: addressSchema.optional(),
    expectedAmountMicroUsdc: uintStringSchema.optional(),
    purpose: z.string().trim().min(1).max(280),
  })
  .superRefine((intent, context) => {
    if (intent.action === "contract_call") return;

    for (const field of [
      "expectedRecipient",
      "expectedAssetAddress",
      "expectedAmountMicroUsdc",
    ] as const) {
      if (!intent[field]) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: `${field} is required for ${intent.action} intent verification`,
        });
      }
    }
  });

export const preflightSchema = z.object({
  network: networkNameSchema.default("arcTestnet"),
  from: addressSchema.optional(),
  to: addressSchema,
  data: hexSchema.default("0x"),
  valueWei: uintStringSchema.default("0"),
  intent: intentSchema,
  policy: z.object({
    allowedTargets: z.array(addressSchema).max(100).optional(),
    maxAmountMicroUsdc: uintStringSchema.optional(),
    allowUnlimitedApproval: z.boolean().default(false),
    requireSimulation: z.boolean().default(true),
  }),
});

export type PreflightInput = z.infer<typeof preflightSchema>;

export const evidenceSchema = z.object({
  network: networkNameSchema.default("arcTestnet"),
  txHash: hexSchema.refine((value) => value.length === 66, "Expected a 32-byte transaction hash"),
  intent: intentSchema,
});

export type EvidenceInput = z.infer<typeof evidenceSchema>;

export const cctpEvidenceSchema = z.object({
  sourceTxHash: hexSchema.refine(
    (value) => value.length === 66,
    "Expected a 32-byte source transaction hash",
  ),
  recipient: addressSchema,
  amountMicroUsdc: uintStringSchema.refine(
    (value) => BigInt(value) > 0n && BigInt(value) <= 1000n,
    "The public test route is capped at 0.001 USDC",
  ),
  feeMicroUsdc: uintStringSchema.refine(
    (value) => BigInt(value) <= 1n,
    "The public test route fee is capped at 0.000001 USDC",
  ),
});

export const developerRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(80, "Name must contain at most 80 characters")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9 ._/@-]*$/,
      "Name contains unsupported characters",
    ),
});

export const developerWebhookSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Webhook URL must be a valid HTTPS URL.")
    .refine((value) => value.startsWith("https://"), "Webhook URL must use HTTPS.")
    .nullable(),
});

export const canSignSchema = z.object({
  network: networkNameSchema.default("arcTestnet"),
  from: addressSchema.optional(),
  to: addressSchema,
  data: hexSchema.default("0x"),
  valueWei: uintStringSchema.default("0"),
  recipient: addressSchema,
  amountMicroUsdc: uintStringSchema,
  purpose: z.string().trim().min(1).max(280),
  assetAddress: addressSchema.optional(),
  payer: addressSchema.optional(),
  maxAmountMicroUsdc: uintStringSchema.optional(),
  requireSimulation: z.boolean().default(true),
});

export type CanSignInput = z.infer<typeof canSignSchema>;
