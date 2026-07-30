import { chromium } from "playwright";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const cdpUrl = process.env.CHROME_CDP_URL ?? "http://127.0.0.1:9333";
const promoDir = join(process.cwd(), "artifacts", "guard-link-promo");
const debugDir = join(promoDir, "x-debug");

const tweetText =
  process.env.TWEET_TEXT ??
  `Send a USDC payment link. They review before they sign.

Create a Guard Link → share the link or QR → payer sees amount, recipient, and purpose on Arc Testnet before approving in their wallet.

Non-custodial. No private keys on our servers.

Try it: https://ledgerguard-gules.vercel.app/guard/create

#USDC #Web3 #x402 #AIagents #ArcTestnet`;

function mediaFiles() {
  return [
    "04-create-qr.png",
    "05-payment-request.png",
    "03-create-filled.png",
    "01-home.png",
  ]
    .map((name) => join(promoDir, name))
    .filter((path) => existsSync(path))
    .slice(0, 4);
}

async function snap(page, name) {
  const path = join(debugDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function clickIfVisible(page, selector, timeout = 5000) {
  const locator = page.locator(selector).first();
  if (await locator.isVisible({ timeout }).catch(() => false)) {
    await locator.click();
    return true;
  }
  return false;
}

const browser = await chromium.connectOverCDP(cdpUrl);
const context = browser.contexts()[0];
const page =
  context.pages().find((entry) => /x\.com|twitter\.com/.test(entry.url())) ??
  (await context.newPage());

if (!page.url().includes("/compose/post")) {
  await page.goto("https://x.com/compose/post", {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
}

await page.waitForTimeout(4000);
await snap(page, "01-compose");

if (page.url().includes("/login") || page.url().includes("/i/flow/login")) {
  writeFileSync(
    join(promoDir, "post-result.json"),
    JSON.stringify({ posted: false, reason: "X login required", url: page.url() }, null, 2),
  );
  throw new Error("X login required. Open x.com in Chrome, log in as @HuiLibaa, rerun post script.");
}

const editor = page.locator('[data-testid="tweetTextarea_0"]').first();
await editor.waitFor({ state: "visible", timeout: 30_000 });

const files = mediaFiles();
if (files.length === 0) {
  throw new Error(`No promo images in ${promoDir}`);
}

const mediaButtons = [
  '[data-testid="toolBar"] [aria-label="Add photos or video"]',
  '[data-testid="toolBar"] [aria-label*="photo"]',
  '[data-testid="toolBar"] [aria-label*="media"]',
  'button[aria-label="Add photos or video"]',
  '[data-testid="attachments"]',
];

let attached = false;
for (const selector of mediaButtons) {
  if (await clickIfVisible(page, selector, 2000)) {
    attached = true;
    break;
  }
}

const fileInput = page.locator('input[type="file"]').first();
try {
  await fileInput.waitFor({ state: "attached", timeout: attached ? 10_000 : 30_000 });
  await fileInput.setInputFiles(files);
} catch (error) {
  await snap(page, "02-upload-failed");
  throw error;
}

await page.waitForTimeout(4000);
await snap(page, "03-media-attached");

const editable = page
  .locator('[data-testid="tweetTextarea_0"] div[contenteditable="true"]')
  .first();
await editable.click({ timeout: 20_000 });
await editable.fill("");
await page.keyboard.type(tweetText, { delay: 5 });
await page.waitForTimeout(1500);
await snap(page, "04-text-filled");

const post = page.locator('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]').last();
await post.waitFor({ state: "visible", timeout: 20_000 });
if ((await post.getAttribute("aria-disabled")) === "true") {
  await snap(page, "05-post-disabled");
  throw new Error("Tweet button disabled.");
}
await post.click();
await page.waitForTimeout(6000);
await snap(page, "06-posted");

const statusUrl = context
  .pages()
  .map((entry) => entry.url())
  .find((url) => /x\.com\/[^/]+\/status\/\d+/.test(url));

const result = {
  posted: true,
  tweetUrl: statusUrl ?? page.url(),
  mediaCount: files.length,
};
writeFileSync(join(promoDir, "post-result.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
