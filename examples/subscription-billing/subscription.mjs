/**
 * Subscription billing example.
 *
 * Flow:
 *   1. A recurring billing job fires for a subscriber's next cycle.
 *   2. LedgerGuard preflights the transfer intent BEFORE the collector asks
 *      the payer to sign (amount = cycle price, recipient = provider,
 *      asset = USDC, purpose = subscription id + cycle).
 *   3. After settlement, LedgerGuard reconciles the on-chain evidence so the
 *      billing system can mark the invoice PAID only when it truly matches.
 *
 * Run:
 *   npm install
 *   LEDGERGUARD_URL=https://ledgerguard-gules.vercel.app node subscription.mjs
 */

import { LedgerGuardClient } from "@ledgerguard1/sdk";

const client = new LedgerGuardClient({
  baseUrl: process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app",
  integration: "reference-subscription-billing",
  clientVersion: "0.1.0",
});

const USDC_ARC_TESTNET = "0x3600000000000000000000000000000000000000";
const PROVIDER = "0xF1437d9CD304aE49f2ec005AC967813B3a7c466c";

function buildTransferCalldata(recipient, amountMicroUsdc) {
  return (
    "0xa9059cbb" +
    recipient.slice(2).toLowerCase().padStart(64, "0") +
    BigInt(amountMicroUsdc).toString(16).padStart(64, "0")
  );
}

/**
 * Bill one subscription cycle. Returns the preflight decision plus the
 * unsigned transaction when the intent is safe.
 */
export async function billCycle({ subscriber, amountMicroUsdc, subscriptionId, cycle }) {
  const data = buildTransferCalldata(PROVIDER, amountMicroUsdc);
  const purpose = `Subscription ${subscriptionId} cycle ${cycle}`;

  const preflight = await client.preflight({
    network: "arcTestnet",
    from: subscriber,
    to: USDC_ARC_TESTNET,
    data,
    intent: {
      action: "transfer",
      expectedDebitAddress: subscriber,
      expectedRecipient: PROVIDER,
      expectedAssetAddress: USDC_ARC_TESTNET,
      expectedAmountMicroUsdc: String(amountMicroUsdc),
      purpose,
    },
    policy: {
      allowedTargets: [USDC_ARC_TESTNET],
      requireSimulation: true,
    },
  });

  return {
    subscriptionId,
    cycle,
    decision: preflight.decision,
    unsignedTransaction:
      preflight.decision === "ALLOW"
        ? { to: USDC_ARC_TESTNET, data, valueWei: "0" }
        : null,
    findings: preflight.findings ?? [],
  };
}

/**
 * Reconcile a settled transaction. Call after the payer confirms the tx hash;
 * returns VERIFIED only when the on-chain transfer matches the declared intent.
 */
export async function reconcileSettlement({ txHash, subscriber, amountMicroUsdc, subscriptionId, cycle }) {
  const evidence = await client.evidence({
    network: "arcTestnet",
    txHash,
    intent: {
      action: "transfer",
      expectedDebitAddress: subscriber,
      expectedRecipient: PROVIDER,
      expectedAssetAddress: USDC_ARC_TESTNET,
      expectedAmountMicroUsdc: String(amountMicroUsdc),
      purpose: `Subscription ${subscriptionId} cycle ${cycle}`,
    },
  });

  return {
    subscriptionId,
    cycle,
    status: evidence.status,
    invoiceMarkedPaid: evidence.status === "VERIFIED",
  };
}

async function main() {
  const subscriber = "0x1111111111111111111111111111111111111111";
  console.log("Subscription billing — preflight before sign, evidence after settlement...\n");

  const billing = await billCycle({
    subscriber,
    amountMicroUsdc: "9900000", // $9.90 / month
    subscriptionId: "SUB-42",
    cycle: 3,
  });
  console.log("1) Bill cycle:", JSON.stringify(billing, null, 2));

  // In a real system the payer signs and broadcasts here; the tx hash is then
  // reconciled. This example shows the reconcile call shape with a placeholder.
  if (billing.decision === "ALLOW") {
    console.log("\n2) (Payer signs & broadcasts — reconcile with the real tx hash.)");
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  main().catch((err) => {
    console.error("Subscription billing failed:", err.message);
    process.exit(1);
  });
}
