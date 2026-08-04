import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const baseUrl =
  process.env.LEDGERGUARD_URL?.replace(/\/$/, "") ??
  "https://ledgerguard-gules.vercel.app";
const cdpUrl = process.env.CHROME_CDP_URL ?? "http://127.0.0.1:9333";
const outDir = join(process.cwd(), "artifacts", "guard-link-promo");

await mkdir(outDir, { recursive: true });

async function connectBrowser() {
  try {
    const browser = await chromium.connectOverCDP(cdpUrl);
    return { browser, page: null, closeMode: "cdp-page" };
  } catch {
    const browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage"],
    });
    return { browser, page: null, closeMode: "launch" };
  }
}

const { browser, closeMode } = await connectBrowser();
const context =
  closeMode === "cdp-page"
    ? browser.contexts()[0] ?? (await browser.newContext())
    : await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page =
  closeMode === "cdp-page"
    ? await context.newPage()
    : await context.newPage();

if (closeMode === "launch") {
  await page.setViewportSize({ width: 1280, height: 720 });
}

async function shot(name) {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(1200);
await shot("01-home");

await page.goto(`${baseUrl}/guard/create`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
await page.waitForTimeout(800);
await shot("02-create-empty");

await page.locator("#guard-issuer").fill("Demo Shop");
await page.locator("#guard-recipient").fill(
  "0x2222222222222222222222222222222222222222",
);
await page.locator("#guard-amount").fill("1.00");
await page.locator("#guard-purpose").fill("Coffee order #42");
await shot("03-create-filled");

await page.locator("#guard-builder").evaluate((form) => form.requestSubmit());
await page.locator("#guard-qr-wrap:not([hidden]) img").waitFor({
  timeout: 30_000,
});
await page.waitForTimeout(1500);
await shot("04-create-qr");

const paymentUrl = await page.locator("#guard-created-url").inputValue();
await writeFile(join(outDir, "payment-url.txt"), paymentUrl, "utf8");

await page.goto(paymentUrl, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(1200);
await shot("05-payment-request");

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
await page.waitForTimeout(800);
await shot("06-payment-wallet-panel");

if (closeMode === "cdp-page") {
  await page.close();
} else {
  await context.close();
  await browser.close();
}

console.log(JSON.stringify({ outDir, paymentUrl, captureMode: closeMode }, null, 2));
