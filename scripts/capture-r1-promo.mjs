/**
 * R1 promo capture: 3 screenshots + tweet draft for X posting.
 * Uses headless Playwright against LEDGERGUARD_URL (default: production).
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const baseUrl =
  process.env.LEDGERGUARD_URL?.replace(/\/$/, "") ??
  "https://ledgerguard-gules.vercel.app";
const outDir = join(process.cwd(), "artifacts", "r1-promo");

const tweetDraft = `Send a USDC payment link. They review before they sign.

Non-custodial Guard Links on Arc Testnet.
Base Mainnet x402 remains disabled while independent settlement and security gates are incomplete.

Create a link:
${baseUrl}/guard/create

#USDC #Web3 #x402 #ArcTestnet #Base`;

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

async function shot(name) {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(1500);
const home = await shot("01-home-hero");

await page.goto(`${baseUrl}/guard/create`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await page.waitForTimeout(1200);
const create = await shot("02-guard-create");

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
await page.waitForTimeout(1200);
const qr = await shot("03-guard-link-qr");

const paymentUrl = await page.locator("#guard-created-url").inputValue();
await page.goto(paymentUrl, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(1200);
const payment = await shot("04-payment-request");

await writeFile(join(outDir, "tweet-draft.txt"), `${tweetDraft}\n`, "utf8");
await writeFile(join(outDir, "payment-url.txt"), `${paymentUrl}\n`, "utf8");
await writeFile(
  join(outDir, "README.md"),
  `# R1 promo pack

Generated against \`${baseUrl}\`.

## Screenshots (attach to X)

1. \`01-home-hero.png\` — homepage + CTA
2. \`02-guard-create.png\` — Guard Builder (aligned BASE + ARC copy)
3. \`03-guard-link-qr.png\` — created link + QR
4. \`04-payment-request.png\` — payer review page (optional 4th)

## Post

Copy \`tweet-draft.txt\` to https://x.com/HuiLibaa

Do **not** claim paying customers, 0.5% fees, or full Base Guard Link live.
`,
  "utf8",
);

await context.close();
await browser.close();

console.log(
  JSON.stringify(
    {
      outDir,
      screenshots: [home, create, qr, payment],
      paymentUrl,
      tweetDraftPath: join(outDir, "tweet-draft.txt"),
    },
    null,
    2,
  ),
);
