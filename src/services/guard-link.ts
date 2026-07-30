import { createHash } from "node:crypto";
import { encodeFunctionData, isAddress, parseAbi } from "viem";
import { z } from "zod";
import { ARC_TESTNET_USDC } from "../config/networks.js";
import type { PreflightInput } from "../schemas.js";

function toMicroUsdc(value: string): bigint {
  const parts = value.split(".");
  const whole = parts[0] ?? "0";
  const fraction = parts[1] ?? "";
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}

const usdcAmountSchema = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/, "Use a positive USDC amount with at most 6 decimals")
  .refine((value) => toMicroUsdc(value) > 0n, "Amount must be greater than zero");

const publicAddressSchema = z
  .string()
  .trim()
  .refine(isAddress, "Expected a valid EVM public address");

export const guardLinkQuerySchema = z
  .object({
    issuer: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .refine(
        (value) => !/[<>\u0000-\u001f\u007f]/.test(value),
        "Issuer contains unsupported characters",
      )
      .optional(),
    payer: publicAddressSchema.optional(),
    recipient: publicAddressSchema,
    amount: usdcAmountSchema,
    limit: usdcAmountSchema.optional(),
    expires: z
      .string()
      .datetime({ offset: true })
      .optional(),
    purpose: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .refine((value) => !/[<>]/.test(value), "Purpose cannot contain markup"),
  })
  .superRefine((query, context) => {
    if (query.limit && toMicroUsdc(query.limit) < toMicroUsdc(query.amount)) {
      context.addIssue({
        code: "custom",
        path: ["limit"],
        message: "The policy limit cannot be lower than the payment amount",
      });
    }
  });

export type GuardLinkQuery = z.infer<typeof guardLinkQuerySchema>;

export function guardLinkIntentId(query: GuardLinkQuery): string {
  const canonical = JSON.stringify({
    amount: query.amount,
    expires: query.expires ?? null,
    issuer: query.issuer ?? null,
    limit: query.limit ?? query.amount,
    payer: query.payer?.toLowerCase() ?? null,
    purpose: query.purpose,
    recipient: query.recipient.toLowerCase(),
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
}

export function createGuardLinkUrl(
  baseUrl: string,
  query: GuardLinkQuery,
): string {
  const url = new URL("/guard", baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function isGuardLinkExpired(
  query: GuardLinkQuery,
  now = new Date(),
): boolean {
  return query.expires ? Date.parse(query.expires) <= now.getTime() : false;
}

const erc20TransferAbi = parseAbi([
  "function transfer(address recipient, uint256 amount) returns (bool)",
]);

export function createGuardLinkPreflight(
  query: GuardLinkQuery,
): PreflightInput {
  const amount = toMicroUsdc(query.amount);
  const limit = toMicroUsdc(query.limit ?? query.amount);
  return {
    network: "arcTestnet",
    ...(query.payer ? { from: query.payer } : {}),
    to: ARC_TESTNET_USDC,
    data: encodeFunctionData({
      abi: erc20TransferAbi,
      functionName: "transfer",
      args: [query.recipient, amount],
    }),
    valueWei: "0",
    intent: {
      action: "transfer",
      ...(query.payer ? { expectedDebitAddress: query.payer } : {}),
      expectedRecipient: query.recipient,
      expectedAssetAddress: ARC_TESTNET_USDC,
      expectedAmountMicroUsdc: amount.toString(),
      purpose: query.purpose,
    },
    policy: {
      maxAmountMicroUsdc: limit.toString(),
      allowUnlimitedApproval: false,
      requireSimulation: Boolean(query.payer),
    },
  };
}
