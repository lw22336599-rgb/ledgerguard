/**
 * AI Agent payment-safety example (MCP-style tool).
 *
 * This example shows how an AI agent should call LedgerGuard BEFORE spending
 * money on behalf of a user. It exposes a single tool, `guardPayment`, which
 * any agent loop (Claude Code, OpenAI, custom MCP host) can invoke with the
 * payment intent; the tool returns ALLOW / REVIEW / BLOCK with findings.
 *
 * Run:
 *   npm install
 *   LEDGERGUARD_URL=https://ledgerguard-gules.vercel.app node agent-mcp.mjs
 */

import { LedgerGuardClient } from "@ledgerguard1/sdk";

const client = new LedgerGuardClient({
  baseUrl: process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app",
  integration: "reference-agent-mcp",
  clientVersion: "0.1.0",
});

const USDC_ARC_TESTNET = "0x3600000000000000000000000000000000000000";

/**
 * Tool signature an agent framework would register.
 * @param {{ payer: string, recipient: string, amountMicroUsdc: string, purpose: string, data?: string }} params
 */
export async function guardPayment(params) {
  const { payer, recipient, amountMicroUsdc, purpose, data } = params;

  if (!/^0x[0-9a-fA-F]{40}$/.test(payer)) {
    return { decision: "BLOCK", reason: "payer is not a valid address" };
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
    return { decision: "BLOCK", reason: "recipient is not a valid address" };
  }

  // ERC-20 transfer calldata: transfer(recipient, amountMicroUsdc)
  const transferData =
    data ??
    "0xa9059cbb" +
      recipient.slice(2).toLowerCase().padStart(64, "0") +
      BigInt(amountMicroUsdc).toString(16).padStart(64, "0");

  const preflight = await client.preflight({
    network: "arcTestnet",
    from: payer,
    to: USDC_ARC_TESTNET,
    data: transferData,
    intent: {
      action: "transfer",
      expectedDebitAddress: payer,
      expectedRecipient: recipient,
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
    decision: preflight.decision,
    findings: preflight.findings ?? [],
    advice:
      preflight.decision === "ALLOW"
        ? "Safe to sign. Hand the unsigned transaction to the wallet."
        : preflight.decision === "REVIEW"
          ? "Do not sign unattended. Surface the findings to the user for approval."
          : "Do NOT sign. The payment failed a safety check.",
  };
}

// ---------------------------------------------------------------------------
// Self-test: run this file directly to see the tool in action.
// ---------------------------------------------------------------------------
async function main() {
  const payer = "0x1111111111111111111111111111111111111111";
  const recipient = "0x2222222222222222222222222222222222222222";
  console.log("Agent payment guard — calling LedgerGuard before signing...\n");
  const result = await guardPayment({
    payer,
    recipient,
    amountMicroUsdc: "1000000",
    purpose: "Reference agent payment",
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  main().catch((err) => {
    console.error("Agent payment guard failed:", err.message);
    process.exit(1);
  });
}
