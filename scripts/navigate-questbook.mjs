/**
 * Navigate Questbook Cohort 2 and dump interactive elements after each step.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "artifacts", "r1-promo", "x-debug");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const page = await context.newPage();

async function dump(step) {
  const info = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    clickables: [...document.querySelectorAll("a,button,[role=button]")]
      .filter((el) => el.offsetParent !== null)
      .slice(0, 40)
      .map((el) => ({
        tag: el.tagName,
        text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60),
        href: el.href ?? null,
      })),
    text: document.body.innerText.slice(0, 2500),
  }));
  await page.screenshot({ path: join(outDir, `questbook-nav-${step}.png`), fullPage: true });
  return info;
}

await page.goto("https://circle.questbook.app/", { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForTimeout(3000);

for (const label of ["Accept Cookies", "Allow All"]) {
  const b = page.getByRole("button", { name: label }).first();
  if (await b.isVisible({ timeout: 1500 }).catch(() => false)) await b.click();
}

const steps = [];
steps.push({ step: "home", ...(await dump("01-home")) });

const openCard = page.locator("text=Open").filter({ has: page.locator("text=Cohort 2") }).first();
if (await openCard.isVisible({ timeout: 3000 }).catch(() => false)) {
  await openCard.click();
} else {
  await page.locator("text=Circle 2026 Cohort 2").first().click();
}
await page.waitForTimeout(4000);
steps.push({ step: "cohort2-click", ...(await dump("02-cohort2")) });

const pd = page.getByRole("button", { name: "Program Details" }).nth(1);
if (await pd.isVisible({ timeout: 3000 }).catch(() => false)) {
  await pd.click();
  await page.waitForTimeout(4000);
  steps.push({ step: "program-details", ...(await dump("03-details")) });
}

for (const label of [
  "Apply now",
  "Apply",
  "Submit proposal",
  "New proposal",
  "Create proposal",
  "Connect wallet",
  "Sign in",
]) {
  const btn = page.getByRole("button", { name: label }).first();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(4000);
    steps.push({ step: `clicked-${label}`, ...(await dump(`04-${label}`)) });
    break;
  }
}

writeFileSync(join(outDir, "questbook-nav-steps.json"), JSON.stringify(steps, null, 2));
console.log(JSON.stringify(steps.map((s) => ({ step: s.step, url: s.url })), null, 2));
