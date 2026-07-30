import { chromium } from "playwright";

const URL = "https://ledgerguard-gules.vercel.app/canary";
const CDP = process.env.CHROME_CDP_URL ?? "http://127.0.0.1:9333";

async function confirmExtensionPages(context) {
  let clicked = false;
  for (const popup of context.pages()) {
    if (!popup.url().includes("chrome-extension://")) continue;
    for (const selector of [
      "[data-testid='confirm-footer-button']",
      "button:has-text('Confirm')",
      "button:has-text('Sign')",
      "button:has-text('Approve')",
      "button:has-text('Connect')",
      "button:has-text('Next')",
    ]) {
      const button = popup.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await button.click();
        clicked = true;
      }
    }
  }
  return clicked;
}

const browser = await chromium.connectOverCDP(CDP);
const context = browser.contexts()[0];
if (!context) throw new Error("No browser context from CDP.");

let page = context.pages().find((p) => p.url().includes("ledgerguard"));
if (!page) {
  page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
} else {
  await page.reload({ waitUntil: "networkidle", timeout: 90000 });
}

await page.locator("#canary-switch").click({ timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2000);
await page.locator("#canary-connect").click({ timeout: 15000 }).catch(() => {});
for (let i = 0; i < 5; i += 1) {
  await page.waitForTimeout(2000);
  await confirmExtensionPages(context);
}

const statusAfterConnect = await page.locator("#canary-status").textContent();
const payEnabled = await page.locator("#canary-pay").isEnabled();
console.log(JSON.stringify({ phase: "connect", statusAfterConnect, payEnabled }));

if (payEnabled) {
  await page.locator("#canary-pay").click();
  for (let i = 0; i < 12; i += 1) {
    await page.waitForTimeout(3000);
    await confirmExtensionPages(context);
    const resultText = await page.locator("#canary-result").textContent().catch(() => "");
    const statusText = await page.locator("#canary-status").textContent().catch(() => "");
    console.log(JSON.stringify({ phase: "pay", step: i, statusText, resultText }));
    if (statusText?.includes("complete") || resultText?.includes("paid=true")) break;
  }
}

console.log(
  JSON.stringify(
    {
      finalStatus: await page.locator("#canary-status").textContent(),
      finalResult: await page.locator("#canary-result").textContent().catch(() => ""),
    },
    null,
    2,
  ),
);

await browser.close();
