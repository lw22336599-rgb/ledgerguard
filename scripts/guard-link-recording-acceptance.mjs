/**
 * Guard Link recording acceptance — automated checks + manual wallet checklist.
 *
 * Usage:
 *   node scripts/local-smoke.mjs   # optional: ensure local server works
 *   LEDGERGUARD_URL=https://ledgerguard-gules.vercel.app node scripts/guard-link-recording-acceptance.mjs
 *
 * Wallet steps (Arc Testnet USDC, no real value) must be done on camera separately.
 */
const baseUrl = (process.env.LEDGERGUARD_URL ?? "http://127.0.0.1:3097").replace(
  /\/$/,
  "",
);
const demoRecipient =
  process.env.GUARD_DEMO_RECIPIENT?.trim() ??
  "0x2222222222222222222222222222222222222222";

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function pass(label) {
  console.log(`PASS ${label}`);
}

async function fetchText(path, options, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(30_000),
    ...options,
  });
  const text = await response.text();
  if (response.status !== expectedStatus) {
    fail(`${path}: expected ${expectedStatus}, got ${response.status}: ${text.slice(0, 240)}`);
  }
  return { response, text };
}

console.log(`\nGuard Link recording acceptance @ ${baseUrl}\n`);

const createPage = await fetchText("/guard/create");
if (
  !createPage.text.includes("Create a USDC payment link.") ||
  !createPage.text.includes("guard-qr-canvas") ||
  !createPage.text.includes("/site-nav.js")
) {
  fail("/guard/create: builder page missing expected UI");
}
pass("/guard/create builder + QR + site-nav");

const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const createResponse = await fetch(`${baseUrl}/v1/guard-links`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    issuer: "Demo Shop",
    recipient: demoRecipient,
    amount: "1.00",
    limit: "1.00",
    purpose: "Screen recording demo",
    expires,
  }),
  signal: AbortSignal.timeout(30_000),
});
const created = await createResponse.json();
if (
  createResponse.status !== 201 ||
  !created.url?.includes("/guard?") ||
  !/^[0-9a-f]{20}$/.test(created.intentId ?? "")
) {
  fail(`/v1/guard-links: ${JSON.stringify(created)}`);
}
pass(`link created intentId=${created.intentId}`);

const paymentPage = await fetchText(created.url.replace(baseUrl, ""));
if (
  !paymentPage.text.includes("Payment request") ||
  !paymentPage.text.includes("Screen recording demo") ||
  !paymentPage.text.includes("Demo Shop") ||
  !paymentPage.text.includes("Connect test wallet")
) {
  fail("payment page missing expected copy");
}
pass("payment page renders Payment request + demo fields");

const reviewOnly = !paymentPage.text.includes('data-decision="ALLOW"');
if (reviewOnly) {
  pass("initial state REVIEW (expected before payer connects)");
} else {
  pass("initial state ALLOW (payer already in URL)");
}

console.log("\n--- Recording URL (open as payer in second browser / phone) ---");
console.log(created.url);
console.log("\n--- Manual on-camera checklist ---");
console.log("1. Merchant screen: open /guard/create, Connect Wallet, fill form, Create payment link");
console.log("2. Show QR code + Copy link (pause 3s each)");
console.log("3. Payer screen: open link above (incognito or phone), read Payment request fields");
console.log("4. Payer: Connect test wallet → approve Arc Testnet switch if prompted");
console.log("5. Wait for page reload with your address → status should become ALLOW");
console.log("6. Payer: Review test payment in wallet → confirm in MetaMask");
console.log("7. Payer: Verify onchain result → show VERIFIED or evidence panel");
console.log("\n--- Arc Testnet payer prerequisites ---");
console.log("- MetaMask on Arc Testnet (chain 5042002)");
console.log("- Test USDC balance (Circle faucet: https://faucet.circle.com/)");
console.log("- Merchant wallet address ≠ payer wallet address for a realistic demo");
console.log("\n--- Acceptance PASS when ---");
console.log("- Link + QR created on camera");
console.log("- Payer sees Payment request with correct amount/recipient/purpose");
console.log("- Wallet connect + sign completes OR evidence verify shows result");
console.log("- No private key / seed phrase entered anywhere\n");
