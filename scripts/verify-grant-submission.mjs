/** Verify LedgerGuard proposal appears on Circle Cohort 2 dashboard. */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const url =
  "https://circle.questbook.app/dashboard/?grantId=6992785dfb7e884efacadb1e&chainId=10&role=community";

const browser = await chromium.connectOverCDP(
  process.env.CHROME_CDP_URL ?? "http://127.0.0.1:9222",
);
const page = await browser.contexts()[0].newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForTimeout(5000);

const text = await page.evaluate(() => document.body.innerText);
const found = /ledgerguard/i.test(text);

const result = {
  url,
  ledgerGuardVisible: found,
  excerpt: text.slice(0, 3000),
};
writeFileSync(
  join(process.cwd(), "artifacts", "r1-promo", "grant-verify.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
