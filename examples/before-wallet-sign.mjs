/**
 * Wallet signing guard: run can-sign before a mocked wallet.sendTransaction.
 *
 * Usage (from repo root after npm run build):
 *   node --import tsx examples/before-wallet-sign.mjs
 *
 * Requires LEDGERGUARD_URL pointing at a running dev server for live RPC, or
 * uses production with requireSimulation:false for a deterministic REVIEW/ALLOW demo.
 */

import { withPreflight } from "../src/sdk/middleware.js";
import { LedgerGuardClient } from "../src/sdk/client.js";

const baseUrl =
  process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app";
const recipient = "0x2222222222222222222222222222222222222222";
const usdc = "0x3600000000000000000000000000000000000000";
const transferCalldata =
  "0xa9059cbb" +
  recipient.slice(2).padStart(64, "0") +
  1_000_000n.toString(16).padStart(64, "0");

const wallet = {
  async sendTransaction(tx) {
    console.log("wallet.sendTransaction called with", tx);
    return { hash: "0x" + "ab".repeat(32) };
  },
};

const client = new LedgerGuardClient({
  baseUrl,
  integration: process.env.LEDGERGUARD_INTEGRATION ?? "before-wallet-sign-example",
});

try {
  const { decision, value } = await withPreflight(
    {
      client,
      useCanSign: true,
      failOnReview: false,
      buildInput: () => ({
        network: "arcTestnet",
        to: usdc,
        data: transferCalldata,
        recipient,
        amountMicroUsdc: "1000000",
        purpose: "Before-wallet-sign example",
        requireSimulation: false,
      }),
    },
    () =>
      wallet.sendTransaction({
        to: usdc,
        data: transferCalldata,
        value: 0n,
      }),
  );
  console.log("Preflight decision:", decision.decision);
  console.log("Simulated tx:", value);
} catch (error) {
  console.error("Blocked before wallet:", error.message ?? error);
  process.exitCode = 1;
}
