/**
 * Production Guard Link E2E: real Arc testnet USDC payment + VERIFIED CTA + create prefill.
 *
 * Usage:
 *   LEDGERGUARD_URL=https://ledgerguard-gules.vercel.app node --env-file-if-exists=.env.x402-buyer.local scripts/guard-link-verified-e2e.mjs
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { chromium } from "playwright";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

const baseUrl = (process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app").replace(
  /\/$/,
  "",
);
const USDC = "0x3600000000000000000000000000000000000000";
const MERCHANT =
  process.env.GUARD_DEMO_RECIPIENT?.trim() ??
  "0x2222222222222222222222222222222222222222";
const AMOUNT = "1.00";
const outDir = join(process.cwd(), "artifacts", "guard-link-e2e");
const reportFile = join(outDir, "acceptance-report.json");

const secretFile = resolve(".env.x402-buyer.local");
const privateKey = readFileSync(secretFile, "utf8")
  .trim()
  .split("=", 2)[1];
if (!privateKey?.startsWith("0x")) {
  throw new Error("Missing X402_BUYER_PRIVATE_KEY in .env.x402-buyer.local");
}
const account = privateKeyToAccount(privateKey);
const payer = account.address;

const rpcUrl = process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(rpcUrl),
});
const walletClient = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http(rpcUrl),
});

const report = {
  baseUrl,
  payer,
  merchant: MERCHANT,
  amount: AMOUNT,
  startedAt: new Date().toISOString(),
  steps: [],
};

function step(name, ok, detail = {}) {
  report.steps.push({ name, ok, at: new Date().toISOString(), ...detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail.message ? `: ${detail.message}` : ""}`);
  if (!ok) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.exit(1);
  }
}

function amountMicroUsdc(value) {
  const parts = value.split(".");
  return (
    BigInt(parts[0] || "0") * 1_000_000n +
    BigInt(((parts[1] || "") + "000000").slice(0, 6))
  );
}

function erc20TransferCalldata(recipient, amount) {
  const to = recipient.slice(2).toLowerCase().padStart(64, "0");
  const value = amount.toString(16).padStart(64, "0");
  return `0xa9059cbb${to}${value}`;
}

mkdirSync(outDir, { recursive: true });

console.log(`\nGuard Link VERIFIED E2E @ ${baseUrl}\n`);

const balance = await publicClient.readContract({
  address: USDC,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [payer],
});
step("payer-usdc-balance", balance >= amountMicroUsdc(AMOUNT), {
  message: `${formatUnits(balance, 6)} USDC`,
  balanceMicro: balance.toString(),
});

const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const createResponse = await fetch(`${baseUrl}/v1/guard-links`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    issuer: "E2E Acceptance",
    recipient: MERCHANT,
    amount: AMOUNT,
    limit: AMOUNT,
    purpose: "Production VERIFIED CTA acceptance",
    expires,
  }),
  signal: AbortSignal.timeout(30_000),
});
const created = await createResponse.json();
step(
  "create-guard-link",
  createResponse.status === 201 && created.url?.includes("/guard?"),
  { intentId: created.intentId, url: created.url },
);

const paymentUrl = new URL(created.url);
paymentUrl.searchParams.set("payer", payer);
const paymentPageUrl = paymentUrl.toString();

const txHash = await walletClient.sendTransaction({
  to: USDC,
  data: erc20TransferCalldata(MERCHANT, amountMicroUsdc(AMOUNT)),
  value: 0n,
});
step("arc-testnet-payment", Boolean(txHash), {
  txHash,
  explorer: `https://testnet.arcscan.app/tx/${txHash}`,
});

const receipt = await publicClient.waitForTransactionReceipt({
  hash: txHash,
  confirmations: 1,
  timeout: 120_000,
});
step("payment-confirmed", receipt.status === "success", {
  blockNumber: receipt.blockNumber.toString(),
});

let evidenceBody = null;
for (let attempt = 1; attempt <= 12; attempt += 1) {
  const evidenceResponse = await fetch(`${baseUrl}/v1/evidence`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      network: "arcTestnet",
      txHash,
      intent: {
        action: "transfer",
        expectedDebitAddress: payer,
        expectedRecipient: MERCHANT,
        expectedAssetAddress: USDC,
        expectedAmountMicroUsdc: amountMicroUsdc(AMOUNT).toString(),
        purpose: "Production VERIFIED CTA acceptance",
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  evidenceBody = await evidenceResponse.json();
  if (evidenceResponse.status === 200 && evidenceBody.status === "VERIFIED") break;
  if (evidenceResponse.status === 404) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000));
    continue;
  }
  break;
}
step("api-evidence-verified", evidenceBody?.status === "VERIFIED", {
  status: evidenceBody?.status,
  evidence: evidenceBody,
});

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage"],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

page.on("dialog", (dialog) => dialog.accept());

await page.addInitScript(({ mockPayer, mockTxHash }) => {
  const shortAddress = (value) =>
    `${value.slice(0, 6)}…${value.slice(-4)}`;
  window.LedgerGuardWallet = {
    getState: () => ({
      account: mockPayer,
      connected: true,
      chainId: "0x4cef52",
    }),
    connect: async () => {},
    ensureChain: async () => {},
    restore: async () => {},
    subscribe: () => {},
    disconnect: () => {},
    shortAddress,
    getProvider: () => ({
      request: async ({ method }) => {
        if (method === "eth_sendTransaction") return mockTxHash;
        throw new Error(`Unsupported mock RPC method: ${method}`);
      },
    }),
  };
}, { mockPayer: payer, mockTxHash: txHash });

await page.goto(paymentPageUrl, { waitUntil: "networkidle", timeout: 90_000 });
await page.locator("#connect-wallet").click();
await page.waitForTimeout(800);
await page.locator("#send-payment:not([disabled])").click({ timeout: 20_000 });
await page.locator("#verify-evidence:not([hidden])").click({ timeout: 20_000 });

await page.locator("#wallet-result.result.allow").waitFor({ timeout: 60_000 });
const verifyText = await page.locator("#wallet-result").innerText();
step("ui-verify-verified", verifyText.includes("VERIFIED"), {
  message: verifyText.split("\n")[0],
});

const cta = page.locator("#guard-cta");
await cta.waitFor({ state: "visible" });
const ctaClasses = await cta.getAttribute("class");
const ctaEyebrow = await cta.locator(".step").innerText();
const ctaHeading = await cta.locator("h2").innerText();
const ctaSummary = await page.locator("#guard-cta-summary").innerText();
const ctaHref = await page.locator("#guard-cta-link").getAttribute("href");
const ctaLinkText = await page.locator("#guard-cta-link").innerText();

step(
  "ui-verified-cta",
  ctaClasses?.includes("guard-cta-verified") &&
    ctaClasses?.includes("guard-cta-highlight") &&
    ctaEyebrow === "PAYMENT VERIFIED" &&
    ctaHeading === "Get paid the same way" &&
    ctaSummary.includes("prefilled") &&
    ctaLinkText === "Create your Guard Link" &&
    ctaHref?.includes("/guard/create") &&
    ctaHref?.includes(`recipient=${payer}`) &&
    ctaHref?.includes("from=verified-payment"),
  {
    ctaClasses,
    ctaEyebrow,
    ctaHeading,
    ctaSummary,
    ctaHref,
    ctaLinkText,
  },
);

await page.screenshot({ path: join(outDir, "verified-cta.png"), fullPage: true });

await page.locator("#guard-cta-link").click();
await page.waitForURL(/\/guard\/create/, { timeout: 30_000 });
await page.waitForLoadState("networkidle");

const prefilledRecipient = await page.locator("#guard-recipient").inputValue();
const noticeVisible = await page.locator("#guard-verified-notice").isVisible();
const noticeText = await page.locator("#guard-verified-notice").innerText();

step(
  "create-page-prefill",
  prefilledRecipient.toLowerCase() === payer.toLowerCase() &&
    noticeVisible &&
    noticeText.includes("Welcome back") &&
    noticeText.includes("prefilled"),
  {
    prefilledRecipient,
    noticeVisible,
    noticeText,
    createUrl: page.url(),
  },
);

await page.screenshot({ path: join(outDir, "create-prefill.png"), fullPage: true });

await context.close();
await browser.close();

report.finishedAt = new Date().toISOString();
report.paymentUrl = paymentPageUrl;
report.txHash = txHash;
report.explorerUrl = `https://testnet.arcscan.app/tx/${txHash}`;
report.evidenceStatus = evidenceBody?.status;
report.artifacts = {
  verifiedCta: join(outDir, "verified-cta.png"),
  createPrefill: join(outDir, "create-prefill.png"),
  report: reportFile,
};
writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("\n--- E2E ACCEPTANCE PASS ---");
console.log(JSON.stringify(report, null, 2));
