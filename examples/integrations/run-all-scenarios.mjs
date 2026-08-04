/**
 * LedgerGuard 15-Scene Integration Library (master demo).
 * Each scene: build real calldata -> call engine preflight -> print decision.
 * All scenes call the real engine. The default is Arc Testnet so the example
 * remains runnable while Base Mainnet is deliberately fail-closed.
 *
 * Run:  node examples/integrations/run-all-scenarios.mjs
 * Env:  LEDGERGUARD_URL (default http://localhost:3000)
 *       LEDGERGUARD_NETWORK (arcTestnet or baseMainnet)
 */
import { LedgerGuardClient } from "@ledgerguard1/sdk";
import { getAddress } from "viem";

const baseUrl = process.env.LEDGERGUARD_URL ?? "http://localhost:3000";
const guard = new LedgerGuardClient({ baseUrl });
const network = process.env.LEDGERGUARD_NETWORK ?? "arcTestnet";
const assets = {
  arcTestnet: "0x3600000000000000000000000000000000000000",
  baseMainnet: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};
if (!(network in assets)) {
  throw new Error(`Unsupported LEDGERGUARD_NETWORK: ${network}`);
}

const BUYER = getAddress("0xF1437d9CD304aE49f2ec005AC967813B3a7c466c");
const USDC = assets[network];
const MERCHANT = getAddress("0x4732d748a7dA766A0192adC2BBefC6041AAF9056");

function transferData(to, amountMicroUsdc) {
  return (
    "0xa9059cbb" +
    to.slice(2).padStart(64, "0") +
    BigInt(amountMicroUsdc).toString(16).padStart(64, "0")
  );
}

async function check(name, to, amountMicroUsdc, purpose, extra = {}) {
  const result = await guard.preflight({
    network,
    from: BUYER,
    to: USDC,
    data: transferData(to, amountMicroUsdc),
    intent: {
      action: "transfer",
      expectedDebitAddress: BUYER,
      expectedRecipient: to,
      expectedAssetAddress: USDC,
      expectedAmountMicroUsdc: String(amountMicroUsdc),
      purpose,
    },
    policy: {},
    ...extra,
  });
  const findings = (result.findings ?? [])
    .map((f) => f.code)
    .slice(0, 2)
    .join(",");
  console.log(
    `${name.padEnd(22)} -> ${String(result.decision).padEnd(6)} [${findings}]`
  );
  return result;
}

console.log(`=== LedgerGuard 15-Scene Integration Library (${network}) ===\n`);

// 1. AI agent payment
await check("1.agent-payment", MERCHANT, 150000, "agent tool payment");

// 2. Ecommerce checkout
await check("2.ecommerce", MERCHANT, 3_500_000, "checkout order 1001");

// 3. Subscription billing
await check("3.subscription", MERCHANT, 1_200_000, "monthly subscription");

// 4. Content Paywall
await check("4.content-paywall", MERCHANT, 250000, "unlock article");

// 5. Tip Jar
await check("5.tip-jar", MERCHANT, 100000, "creator tip");

// 6. Metered API billing
await check("6.metered-api", MERCHANT, 200000, "API usage metering");

// 7. Crowdfunding / presale
await check("7.crowdfunding", MERCHANT, 5_000_000, "crowdfund pledge");

// 8. Game items / virtual goods
await check("8.game-items", MERCHANT, 300000, "buy game skin");

// 9. Cross-border remittance
await check("9.cross-border", MERCHANT, 10_000_000, "cross-border payment");

// 10. White-label service fee
await check("10.white-label", MERCHANT, 1_500_000, "white-label service fee");

// 11. NFT mint paywall
await check("11.nft-mint", MERCHANT, 400000, "mint NFT");

// 12. Refund / dispute evidence check
await check("12.refund-dispute", MERCHANT, 250000, "refund settlement");

// 13. Donation
await check("13.donation", MERCHANT, 500000, "donation");

// 14. Auction deposit
await check("14.auction-deposit", MERCHANT, 2_000_000, "auction deposit");

// 15. Payroll / streaming
await check("15.payroll-stream", MERCHANT, 8_000_000, "payroll streaming");

console.log("\n--- Security cases (must not ALLOW) ---");
// Zero address recipient — must block
await check("zero-address", "0x0000000000000000000000000000000000000000", 100000, "burn");
// Seed blacklist check
await check("burn-address", "0x000000000000000000000000000000000000dEaD", 100000, "burn-address test");
// Mismatched intent (claims A but pays B)
const mismatch = await guard.preflight({
  network,
  from: BUYER,
  to: USDC,
  data: transferData(MERCHANT, 1000000),
  intent: {
    action: "transfer",
    expectedDebitAddress: BUYER,
    expectedRecipient: "0x1111111111111111111111111111111111111111",
    expectedAssetAddress: USDC,
    expectedAmountMicroUsdc: "1000000",
    purpose: "intent mismatch demo",
  },
  policy: {},
});
console.log(
  `intent-mismatch`.padEnd(22) +
    ` -> ${String(mismatch.decision).padEnd(6)} [recipient mismatch]`
);
