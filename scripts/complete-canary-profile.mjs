/**
 * Launch Chrome with a copied profile (extensions enabled) and run canary CDP flow.
 * Uses a non-default user-data-dir so remote debugging works with MetaMask/OKX.
 */
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const URL = "https://ledgerguard-gules.vercel.app/canary";
const CDP = "http://127.0.0.1:9333";
const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE_ROOT = join(process.cwd(), "tmp", "chrome-canary-profile");
const PROFILE_DIR = join(PROFILE_ROOT, "Default");
const SOURCE = join(
  process.env.LOCALAPPDATA ?? "",
  "Google",
  "Chrome",
  "User Data",
  "Default",
);

function robocopySync(from, to) {
  try {
    execFileSync(
      "robocopy",
      [from, to, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"],
      { stdio: "ignore" },
    );
  } catch (error) {
    const status = error?.status;
    if (typeof status === "number" && status >= 0 && status <= 7) return;
    throw error;
  }
}

function syncProfile() {
  mkdirSync(PROFILE_ROOT, { recursive: true });
  mkdirSync(PROFILE_DIR, { recursive: true });
  for (const folder of ["Extensions", "Local Extension Settings"]) {
    const from = join(SOURCE, folder);
    const to = join(PROFILE_DIR, folder);
    if (!existsSync(from)) continue;
    robocopySync(from, to);
  }
  const preferences = join(SOURCE, "Preferences");
  if (existsSync(preferences)) {
    copyFileSync(preferences, join(PROFILE_DIR, "Preferences"));
  }
}

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
      if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
        await button.click();
        clicked = true;
      }
    }
  }
  return clicked;
}

try {
  execFileSync("taskkill", ["/IM", "chrome.exe", "/F"], { stdio: "ignore" });
} catch {
  // Chrome may not be running.
}

syncProfile();

spawn(
  CHROME,
  [
    "--remote-debugging-port=9333",
    `--user-data-dir=${PROFILE_ROOT}`,
    "--profile-directory=Default",
    "--no-first-run",
    "--no-default-browser-check",
    URL,
  ],
  { detached: true, stdio: "ignore" },
).unref();

await new Promise((resolve) => setTimeout(resolve, 8000));

const browser = await chromium.connectOverCDP(CDP);
const context = browser.contexts()[0];
if (!context) throw new Error("No browser context from CDP.");

let page = context.pages().find((p) => p.url().includes("ledgerguard"));
if (!page) {
  page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 120_000 });
}

await page.waitForTimeout(5000);
const hasEth = await page.evaluate(() => Boolean(window.ethereum));
const providers = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const found = [];
      window.addEventListener("eip6963:announceProvider", (event) => {
        const detail = event.detail?.info?.name;
        if (detail) found.push(detail);
      });
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      setTimeout(() => resolve(found), 3000);
    }),
);
console.log(JSON.stringify({ hasEth, providers }));

await page.locator("#canary-switch").click({ timeout: 20_000 }).catch(() => {});
await page.waitForTimeout(2000);
await page.locator("#canary-connect").click({ timeout: 20_000 });
for (let i = 0; i < 8; i += 1) {
  await page.waitForTimeout(2000);
  await confirmExtensionPages(context);
}

const payEnabled = await page.locator("#canary-pay").isEnabled();
console.log(
  JSON.stringify({
    phase: "connect",
    status: await page.locator("#canary-status").textContent(),
    payEnabled,
  }),
);

if (payEnabled) {
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
