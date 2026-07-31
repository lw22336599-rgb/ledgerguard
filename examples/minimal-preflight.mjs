/**
 * Minimal preflight via POST /v1/can-sign (no SDK install required).
 *
 * Usage:
 *   node examples/minimal-preflight.mjs
 *
 * Optional env:
 *   LEDGERGUARD_URL=http://127.0.0.1:8787
 *   LEDGERGUARD_INTEGRATION=minimal-preflight-local
 */

const baseUrl =
  process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app";
const recipient = "0x2222222222222222222222222222222222222222";
const usdc = "0x3600000000000000000000000000000000000000";
const data =
  "0xa9059cbb" +
  recipient.slice(2).padStart(64, "0") +
  1_000_000n.toString(16).padStart(64, "0");

const response = await fetch(`${baseUrl}/v1/can-sign`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-ledgerguard-client": "examples/minimal-preflight/0.1.0",
    ...(process.env.LEDGERGUARD_INTEGRATION
      ? { "x-ledgerguard-integration": process.env.LEDGERGUARD_INTEGRATION }
      : {}),
  },
  body: JSON.stringify({
    network: "arcTestnet",
    to: usdc,
    data,
    valueWei: "0",
    recipient,
    amountMicroUsdc: "1000000",
    purpose: "Minimal can-sign example",
    requireSimulation: false,
  }),
});

const result = await response.json();
if (!response.ok) throw new Error(JSON.stringify(result));
console.log(JSON.stringify(result, null, 2));
