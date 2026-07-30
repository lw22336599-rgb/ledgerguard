/**
 * Complete Base Mainnet canary via Chrome + MetaMask (persistent profile).
 * Requires Chrome to be closed so the Default profile is not locked.
 */
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { join } from "node:path";

const URL = "https://ledgerguard-gules.vercel.app/canary";
const USER_DATA = join(
  process.env.LOCALAPPDATA ?? "",
  "Google",
  "Chrome",
  "User Data",
);
const PAYER = "0xF1437D9cD304ae49F2Ec005AC967813b3a7C466C";

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

if (!existsSync(USER_DATA)) {
  throw new Error(`Chrome profile not found at ${USER_DATA}`);
}

const context = await chromium.launchPersistentContext(USER_DATA, {
  channel: "chrome",
  headless: false,
  args: ["--profile-directory=Default"],
});

const page =
  context.pages().find((p) => p.url().includes("ledgerguard")) ??
  (await context.newPage());
await page.goto(URL, { waitUntil: "networkidle", timeout: 120_000 });

await page.locator("#canary-switch").click({ timeout: 20_000 }).catch(() => {});
await page.waitForTimeout(2000);
await page.locator("#canary-connect").click({ timeout: 20_000 });
for (let i = 0; i < 8; i += 1) {
  await page.waitForTimeout(2000);
  await confirmExtensionPages(context);
}

const statusAfterConnect = await page.locator("#canary-status").textContent();
const payEnabled = await page.locator("#canary-pay").isEnabled();
console.log(
  JSON.stringify({ phase: "connect", statusAfterConnect, payEnabled }),
);

if (!payEnabled) {
  console.log(
    JSON.stringify({
      error: "Pay button disabled",
      hint: "Connect MetaMask with the funded payer wallet and Base Mainnet.",
      expectedPayer: PAYER,
    }),
  );
  await context.close();
  process.exit(1);
}

await page.locator("#canary-pay").click();
for (let i = 0; i < 15; i += 1) {
  await page.waitForTimeout(3000);
  await confirmExtensionPages(context);
  const resultText = await page
    .locator("#canary-result")
    .textContent()
    .catch(() => "");
  const statusText = await page.locator("#canary-status").textContent();
  console.log(JSON.stringify({ phase: "pay", step: i, statusText, resultText }));
  if (
    resultText?.toLowerCase().includes("paid") ||
    statusText?.toLowerCase().includes("complete")
  ) {
    break;
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

await context.close();
