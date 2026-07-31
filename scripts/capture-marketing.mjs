/**
 * Regenerate public/marketing/*.png against a running LedgerGuard instance.
 * Usage: LEDGERGUARD_URL=http://127.0.0.1:3000 node scripts/capture-marketing.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const baseUrl =
  process.env.LEDGERGUARD_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:3000";
const outDir = join(process.cwd(), "public", "marketing");
const payer = "0x257713534b81f053200c94ecEFDc0aAfa92dF68F";
const txHash =
  "0x8d832e5b7a8eadf4d1c82cdd39d45d3e3c29a13cdabf976079eefcef824dcd4d";

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("dialog", (dialog) => dialog.accept());

async function clipShot(name, selector) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: "visible", timeout: 60_000 });
  await locator.screenshot({
    path: join(outDir, name),
    animations: "disabled",
  });
}

await page.goto(`${baseUrl}/guard/create`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await page.waitForTimeout(800);
await clipShot("step-create.png", "#guard-builder");

await page.locator("#guard-issuer").fill("Demo Shop");
await page.locator("#guard-recipient").fill(
  "0x2222222222222222222222222222222222222222",
);
await page.locator("#guard-amount").fill("1.00");
await page.locator("#guard-purpose").fill("Coffee order #42");
await page.locator("#guard-builder").evaluate((form) => form.requestSubmit());
await page.locator("#guard-qr-wrap:not([hidden]) canvas").waitFor({
  timeout: 30_000,
});
await page.waitForTimeout(800);
await clipShot("hero-guard-builder.png", ".builder-panel");

const paymentUrl = new URL(
  `${baseUrl}/guard?issuer=Demo+Shop&recipient=0x2222222222222222222222222222222222222222&amount=1.00&limit=1.00&purpose=Coffee+order+%2342&expires=2026-12-31T00%3A00%3A00.000Z`,
);

await page.goto(paymentUrl.toString(), {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await page.waitForTimeout(800);
await clipShot("step-payment.png", "main > .panel");

await page.addInitScript(({ mockPayer, mockTxHash }) => {
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
    shortAddress: (value) => `${value.slice(0, 6)}…${value.slice(-4)}`,
    getProvider: () => ({
      request: async ({ method }) => {
        if (method === "eth_sendTransaction") return mockTxHash;
        throw new Error(`Unsupported mock RPC method: ${method}`);
      },
    }),
  };
}, { mockPayer: payer, mockTxHash: txHash });

await page.goto(paymentUrl.toString(), {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await page.locator("#connect-wallet").click();
await page.locator("#send-payment:not([disabled])").click({ timeout: 20_000 });
await page.locator("#verify-evidence:not([hidden])").click({ timeout: 20_000 });
await page.locator("#guard-cta.guard-cta-verified").waitFor({ timeout: 60_000 });
await page.waitForTimeout(600);
await clipShot("step-verified.png", "#guard-cta.guard-cta-verified");

await browser.close();
console.log(JSON.stringify({ outDir, baseUrl }, null, 2));
