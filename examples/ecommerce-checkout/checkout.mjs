/**
 * E-commerce checkout example.
 *
 * Flow:
 *   1. Buyer builds a cart and clicks "Pay with USDC".
 *   2. The checkout backend builds the unsigned transfer calldata.
 *   3. LedgerGuard preflights it against the merchant's declared intent
 *      (recipient = merchant, amount = cart total, asset = USDC).
 *   4. Only ALLOW results are handed to the wallet for signing.
 *
 * Run:
 *   npm install
 *   LEDGERGUARD_URL=https://ledgerguard-gules.vercel.app node checkout.mjs
 */

import { LedgerGuardClient } from "@ledgerguard1/sdk";

const client = new LedgerGuardClient({
  baseUrl: process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app",
  integration: "reference-ecommerce-checkout",
  clientVersion: "0.1.0",
});

const USDC_ARC_TESTNET = "0x3600000000000000000000000000000000000000";
const MERCHANT = "0xF1437d9CD304aE49f2ec005AC967813B3a7c466c";

function buildTransferCalldata(recipient, amountMicroUsdc) {
  return (
    "0xa9059cbb" +
    recipient.slice(2).toLowerCase().padStart(64, "0") +
    BigInt(amountMicroUsdc).toString(16).padStart(64, "0")
  );
}

/**
 * Checkout a USDC order. Returns the preflight decision and, when safe,
 * the unsigned transaction to pass to the buyer's wallet.
 */
export async function checkoutOrder({ buyer, amountMicroUsdc, orderId }) {
  const data = buildTransferCalldata(MERCHANT, amountMicroUsdc);

  const preflight = await client.preflight({
    network: "arcTestnet",
    from: buyer,
    to: USDC_ARC_TESTNET,
    data,
    intent: {
      action: "transfer",
      expectedDebitAddress: buyer,
      expectedRecipient: MERCHANT,
      expectedAssetAddress: USDC_ARC_TESTNET,
      expectedAmountMicroUsdc: String(amountMicroUsdc),
      purpose: `E-commerce order ${orderId}`,
    },
    policy: {
      allowedTargets: [USDC_ARC_TESTNET],
      requireSimulation: true,
    },
  });

  return {
    orderId,
    decision: preflight.decision,
    unsignedTransaction:
      preflight.decision === "ALLOW"
        ? { to: USDC_ARC_TESTNET, data, valueWei: "0" }
        : null,
    findings: preflight.findings ?? [],
  };
}

async function main() {
  const buyer = "0x1111111111111111111111111111111111111111";
  console.log("E-commerce checkout — preflight before wallet sign...\n");
  const result = await checkoutOrder({
    buyer,
    amountMicroUsdc: "2500000", // $2.50
    orderId: "ORD-1001",
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  main().catch((err) => {
    console.error("Checkout failed:", err.message);
    process.exit(1);
  });
}
