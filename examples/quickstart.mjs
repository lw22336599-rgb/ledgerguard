/**
 * Quickstart with @ledgerguard1/sdk (developer preflight + attribution).
 *
 * From repo root:
 *   npm run build:sdk
 *   $env:LEDGERGUARD_API_KEY = "lg_test_..."
 *   node examples/quickstart.mjs
 *
 * External project:
 *   npm install @ledgerguard1/sdk
 */
import { LedgerGuardClient } from "@ledgerguard1/sdk";

const baseUrl =
  process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app";
const apiKey = process.env.LEDGERGUARD_API_KEY;

if (!apiKey) {
  throw new Error(
    "Set LEDGERGUARD_API_KEY to a test key created at /developer.",
  );
}

const recipient = "0x2222222222222222222222222222222222222222";
const usdc = "0x3600000000000000000000000000000000000000";
const data =
  "0xa9059cbb" +
  recipient.slice(2).padStart(64, "0") +
  1_000_000n.toString(16).padStart(64, "0");

const client = new LedgerGuardClient({
  baseUrl,
  apiKey,
  integration: process.env.LEDGERGUARD_INTEGRATION ?? "quickstart-local",
});

const result = await client.preflight({
  network: "arcTestnet",
  to: usdc,
  data,
  valueWei: "0",
  intent: {
    action: "transfer",
    expectedRecipient: recipient,
    expectedAssetAddress: usdc,
    expectedAmountMicroUsdc: "1000000",
    purpose: "Five-minute LedgerGuard integration",
  },
  policy: {
    allowUnlimitedApproval: false,
    requireSimulation: false,
    maxAmountMicroUsdc: "1000000",
  },
});

console.log(JSON.stringify(result, null, 2));
