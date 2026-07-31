/**
 * Publish @ledgerguard1/sdk — opens npm web OTP auth if CLI publish needs 2FA.
 */
import { execSync, spawn } from "node:child_process";
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "artifacts", "r1-promo", "x-debug");
mkdirSync(outDir, { recursive: true });

const ports = ["http://127.0.0.1:9222", "http://127.0.0.1:9333"];

function tryPublish() {
  try {
    execSync("npm publish --access public", {
      cwd: join(process.cwd(), "packages", "sdk"),
      encoding: "utf8",
      stdio: "pipe",
      env: {
        ...process.env,
        ...(process.env.NPM_TOKEN ? { NODE_AUTH_TOKEN: process.env.NPM_TOKEN } : {}),
      },
    });
    return { ok: true };
  } catch (error) {
    const stderr = String(error.stderr ?? error.message ?? "");
    const authMatch = stderr.match(/https:\/\/www\.npmjs\.com\/auth\/cli\/[^\s]+/);
    const doneMatch = stderr.match(/https:\/\/registry\.npmjs\.org\/-\/v1\/done\?authId=[^\s]+/);
    return { ok: false, stderr, authUrl: authMatch?.[0], doneUrl: doneMatch?.[0] };
  }
}

async function connectCdp() {
  for (const url of ports) {
    try {
      return await chromium.connectOverCDP(url);
    } catch {
      // next
    }
  }
  return null;
}

const first = tryPublish();
if (first.ok) {
  const version = execSync("npm view @ledgerguard1/sdk version", { encoding: "utf8" }).trim();
  const result = { published: true, version, method: "cli" };
  writeFileSync(join(outDir, "..", "npm-publish-result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

const result = {
  published: false,
  authUrl: first.authUrl,
  doneUrl: first.doneUrl,
  notes: [],
};

if (first.authUrl) {
  const browser = await connectCdp();
  if (browser) {
    const context = browser.contexts()[0];
    const page = context?.pages()[0] ?? (await context.newPage());
    await page.goto(first.authUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    result.notes.push("Opened npm OTP auth in existing Chrome — complete 2FA in browser window.");
    await page.waitForTimeout(30_000);
    await page.screenshot({ path: join(outDir, "npm-auth.png"), fullPage: true });
  } else {
    result.notes.push(`Open manually for npm OTP: ${first.authUrl}`);
  }

  const retry = tryPublish();
  if (retry.ok) {
    result.published = true;
    result.version = execSync("npm view @ledgerguard1/sdk version", { encoding: "utf8" }).trim();
  }
}

writeFileSync(join(outDir, "..", "npm-publish-result.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.published ? 0 : 1);
