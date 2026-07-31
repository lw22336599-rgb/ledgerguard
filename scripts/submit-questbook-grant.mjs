/**
 * Submit LedgerGuard to Circle 2026 Cohort 2 on Questbook.
 * Direct dashboard URL discovered via navigate-questbook.mjs.
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const cdpUrl = process.env.CHROME_CDP_URL ?? "http://127.0.0.1:9222";
const grantDashboard =
  "https://circle.questbook.app/dashboard/?grantId=6992785dfb7e884efacadb1e&chainId=10&role=community";
const outDir = join(process.cwd(), "artifacts", "r1-promo", "x-debug");
mkdirSync(outDir, { recursive: true });

const grantMd = readFileSync(
  join(process.cwd(), "docs", "GRANT_APPLICATION_COPYPASTE.md"),
  "utf8",
);

function between(start, end) {
  const a = grantMd.indexOf(start);
  if (a < 0) return "";
  const b = grantMd.indexOf(end, a + start.length);
  return grantMd.slice(a + start.length, b < 0 ? undefined : b).trim();
}

const shortDescription =
  "Non-custodial Arc USDC payment intent safety: Guard Links, preflight API (ALLOW/REVIEW/BLOCK), post-settlement evidence, npm SDK, x402-compatible mapping — no custody, no private keys.";
const longDescription = between("## Long description (paste into", "## Why Arc");
const teamSection = between("## Team (copy-paste for grant form)", "## Links to attach");

async function snap(page, name) {
  await page.screenshot({ path: join(outDir, `grant-${name}.png`), fullPage: true });
}

async function confirmWalletPopups(context, rounds = 8) {
  let clicked = false;
  for (let i = 0; i < rounds; i += 1) {
    for (const popup of context.pages()) {
      if (!/chrome-extension:\/\//.test(popup.url())) continue;
      for (const label of [
        "Connect",
        "Approve",
        "Sign",
        "Confirm",
        "Next",
        "Got it",
      ]) {
        const btn = popup.getByRole("button", { name: label }).first();
        if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
          await btn.click().catch(() => {});
          clicked = true;
        }
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return clicked;
}

const browser = await chromium.connectOverCDP(cdpUrl);
const context = browser.contexts()[0];
if (!context) throw new Error("No CDP context");

const page = await context.newPage();
const result = {
  cdpUrl,
  grantDashboard,
  filled: {},
  submitted: false,
  notes: [],
};

await page.goto(grantDashboard, { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForTimeout(4000);
await snap(page, "01-dashboard");

const submitEntry = page.getByRole("button", { name: "Submit Proposal" }).first();
await submitEntry.waitFor({ state: "visible", timeout: 30_000 });
await submitEntry.click();
await page.waitForTimeout(5000);
await confirmWalletPopups(context);
await snap(page, "02-after-submit-click");

for (const label of ["Connect wallet", "Sign in", "Connect", "MetaMask", "Continue"]) {
  const btn = page.getByRole("button", { name: label }).first();
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    result.notes.push(`Wallet step: ${label}`);
    await page.waitForTimeout(5000);
    await confirmWalletPopups(context);
    break;
  }
}

await page.waitForTimeout(5000);
await snap(page, "03-after-wallet");

const inputs = page.locator("input:visible, textarea:visible");
const inputCount = await inputs.count();
for (let i = 0; i < inputCount; i += 1) {
  const el = inputs.nth(i);
  const ph = ((await el.getAttribute("placeholder")) ?? "").toLowerCase();
  const name = ((await el.getAttribute("name")) ?? "").toLowerCase();
  const label = ph || name;
  let value = null;
  if (/title|project|name/.test(label)) value = "LedgerGuard";
  else if (/website|url|link/.test(label)) value = "https://ledgerguard-gules.vercel.app";
  else if (/github|repo/.test(label)) value = "https://github.com/lw22336599-rgb/ledgerguard";
  else if (/email|contact/.test(label)) value = "lw22336599@gmail.com";
  else if (/amount|funding|usdc|usd/.test(label)) value = "35000";
  if (value) {
    await el.fill(value);
    result.filled[label || `input-${i}`] = true;
  }
}

const textareas = page.locator("textarea:visible");
if ((await textareas.count()) > 0) {
  await textareas.first().fill(shortDescription);
  result.filled.shortDescription = true;
}

const editors = page.locator('[contenteditable="true"]:visible');
const editorCount = await editors.count();
for (let i = 0; i < editorCount; i += 1) {
  const box = await editors.nth(i).boundingBox().catch(() => null);
  if (!box || box.height < 80) continue;
  await editors.nth(i).click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type(longDescription.slice(0, 15000), { delay: 0 });
  result.filled.longDescription = true;
  break;
}

await page.waitForTimeout(2000);
await snap(page, "04-filled");

const finalSubmit = page
  .getByRole("button", { name: /submit proposal|publish|submit|save draft/i })
  .last();
if (await finalSubmit.isVisible({ timeout: 5000 }).catch(() => false)) {
  if (!(await finalSubmit.isDisabled().catch(() => true))) {
    await finalSubmit.click();
    await page.waitForTimeout(12_000);
    await confirmWalletPopups(context);
    result.submitted = true;
    result.notes.push("Final submit clicked");
  } else {
    result.notes.push("Final submit disabled — wallet signature or required fields missing");
  }
}

await snap(page, "05-final");
result.finalUrl = page.url();

writeFileSync(
  join(process.cwd(), "artifacts", "r1-promo", "grant-submit-result.json"),
  JSON.stringify(result, null, 2),
);
writeFileSync(
  join(process.cwd(), "docs", "QUESTBOOK_GRANT_URL.md"),
  `# Circle 2026 Cohort 2 — direct apply URL

**Open (580+ proposals):** Circle 2026 Cohort 2

| Field | Value |
| --- | --- |
| Dashboard | ${grantDashboard} |
| grantId | \`6992785dfb7e884efacadb1e\` |
| chainId | \`10\` |
| Copy-paste | \`docs/GRANT_APPLICATION_COPYPASTE.md\` |

Steps: open dashboard → **Submit Proposal** → connect wallet → paste form → sign onchain submit.
`,
  "utf8",
);

console.log(JSON.stringify(result, null, 2));
