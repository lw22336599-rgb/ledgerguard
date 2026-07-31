/**
 * Probe Questbook portal DOM for grant apply links and form fields.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "artifacts", "r1-promo", "x-debug");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const page = await context.newPage();

await page.goto("https://circle.questbook.app/", {
  waitUntil: "networkidle",
  timeout: 120_000,
});
await page.waitForTimeout(8000);

const links = await page.evaluate(() =>
  [...document.querySelectorAll("a[href]")].map((a) => ({
    text: (a.textContent ?? "").trim().slice(0, 80),
    href: a.href,
  })),
);

const buttons = await page.evaluate(() =>
  [...document.querySelectorAll("button")].map((b) => ({
    text: (b.textContent ?? "").trim().slice(0, 80),
    disabled: b.disabled,
  })),
);

const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 4000));

await page.screenshot({ path: join(outDir, "questbook-probe.png"), fullPage: true });

const report = { url: page.url(), links, buttons, bodyTextPreview: bodyText };
writeFileSync(join(outDir, "questbook-probe.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
