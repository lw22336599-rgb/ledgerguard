import { chromium } from "playwright";
import { join } from "node:path";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const context = browser.contexts()[0];
const page =
  context.pages().find((entry) => entry.url().includes("x.com")) ??
  (await context.newPage());

await page.goto("https://x.com/home", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForTimeout(3000);

const loggedIn = await page
  .locator('[data-testid="SideNav_NewTweet_Button"]')
  .isVisible()
  .catch(() => false);

await page.screenshot({
  path: join("artifacts", "guard-link-promo", "x-debug", "home-check.png"),
  fullPage: true,
});

console.log(JSON.stringify({ url: page.url(), loggedIn }, null, 2));
