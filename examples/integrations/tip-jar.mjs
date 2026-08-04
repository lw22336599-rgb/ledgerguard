/**
 * Tip Jar integration — creator receives tips, engine checks recipient safety.
 * Real engine call. VERIFIED 2026-08-04.
 */
import { LedgerGuardClient } from "@ledgerguard1/sdk";
import { getAddress } from "viem";

const baseUrl = process.env.LEDGERGUARD_URL ?? "http://localhost:3000";
const guard = new LedgerGuardClient({ baseUrl });

const TIPPER = getAddress("0xF1437d9CD304aE49f2ec005AC967813B3a7c466c");
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const CREATOR = getAddress("0x4732d748a7dA766A0192adC2BBefC6041AAF9056");

async function sendTip(creator, amountMicroUsdc) {
  const data =
    "0xa9059cbb" +
    creator.slice(2).padStart(64, "0") +
    amountMicroUsdc.toString(16).padStart(64, "0");

  const result = await guard.preflight({
    network: "baseMainnet",
    from: TIPPER,
    to: USDC,
    data,
    intent: {
      action: "transfer",
      expectedDebitAddress: TIPPER,
      expectedRecipient: creator,
      expectedAssetAddress: USDC,
      expectedAmountMicroUsdc: String(amountMicroUsdc),
      purpose: "Tip for content",
    },
    policy: {},
  });

  console.log(`[tip-jar] tip ${amountMicroUsdc / 1e6} USDC to ${creator.slice(0, 10)}`);
  console.log("decision:", result.decision);
  return result;
}

await sendTip(CREATOR, 100000);
await sendTip("0x0000000000000000000000000000000000000000", 100000);
