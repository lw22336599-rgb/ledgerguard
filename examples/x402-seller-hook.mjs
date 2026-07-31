/**
 * x402 seller hook pattern: preflight before returning paid content.
 *
 * This example uses preflightFetch to gate a mock paid endpoint.
 *
 * Usage:
 *   node --import tsx examples/x402-seller-hook.mjs
 */

import { LedgerGuardClient, preflightFetch } from "../src/sdk/middleware.js";

const baseUrl =
  process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app";
const recipient = "0x2222222222222222222222222222222222222222";
const usdc = "0x3600000000000000000000000000000000000000";
const transferCalldata =
  "0xa9059cbb" +
  recipient.slice(2).padStart(64, "0") +
  1_000_000n.toString(16).padStart(64, "0");

const client = new LedgerGuardClient({
  baseUrl,
  integration: process.env.LEDGERGUARD_INTEGRATION ?? "x402-seller-hook-example",
});

async function handlePaidRequest(expectedAmountMicroUsdc) {
  const gated = await preflightFetch(
    client,
    {
      network: "arcTestnet",
      to: usdc,
      data: transferCalldata,
      recipient,
      amountMicroUsdc: expectedAmountMicroUsdc,
      purpose: "x402 seller hook demo",
      requireSimulation: false,
    },
    {
      url: "https://example.test/paid-resource",
      method: "GET",
    },
    { useCanSign: true },
  );

  if (!gated.ok) {
    const body = await gated.json();
    return { status: gated.status, body };
  }

  return {
    status: 200,
    body: {
      content: "Paid resource payload",
      preflightRequestId: gated.headers.get("x-ledgerguard-preflight-request-id"),
    },
  };
}

const blocked = await handlePaidRequest("2000000");
console.log("Amount mismatch (expect REVIEW/BLOCK):", blocked);

const allowed = await handlePaidRequest("1000000");
console.log("Matching amount:", allowed);
