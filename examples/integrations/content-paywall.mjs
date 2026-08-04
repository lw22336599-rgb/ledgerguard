/**
 * Content Paywall integration — unlock paid article/video after preflight passes.
 * Real engine call against localhost:3000 (or deployed URL).
 * VERIFIED: runs against live engine (2026-08-04).
 */
import { LedgerGuardClient } from "@ledgerguard1/sdk";
import { getAddress } from "viem";

const baseUrl = process.env.LEDGERGUARD_URL ?? "http://localhost:3000";
const guard = new LedgerGuardClient({ baseUrl });

const BUYER = getAddress("0xF1437d9CD304aE49f2ec005AC967813B3a7c466c");
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const CONTENT_WALLET = getAddress("0x4732d748a7dA766A0192adC2BBefC6041AAF9056");

async function unlockContent(articleId, priceMicroUsdc) {
  const data =
    "0xa9059cbb" +
    CONTENT_WALLET.slice(2).padStart(64, "0") +
    priceMicroUsdc.toString(16).padStart(64, "0");

  const result = await guard.preflight({
    network: "baseMainnet",
    from: BUYER,
    to: USDC,
    data,
    intent: {
      action: "transfer",
      expectedDebitAddress: BUYER,
      expectedRecipient: CONTENT_WALLET,
      expectedAssetAddress: USDC,
      expectedAmountMicroUsdc: String(priceMicroUsdc),
      purpose: `Unlock article ${articleId}`,
    },
    policy: {},
  });

  console.log(`[content-paywall] article=${articleId} price=${priceMicroUsdc / 1e6} USDC`);
  console.log("decision:", result.decision);
  return result;
}

await unlockContent("paywall-001", 250000); // 0.25 USDC
