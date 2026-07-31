/**
 * Full UI module audit: HTTP, assets, desktop/mobile layout, console errors.
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const baseUrl =
  process.env.LEDGERGUARD_URL?.replace(/\/$/, "") ??
  "https://ledgerguard-gules.vercel.app";
const outDir = join(process.cwd(), "artifacts", "ui-audit");

const pages = [
  { path: "/", name: "home", marker: "Send a USDC payment link." },
  { path: "/guard/create", name: "guard-create", marker: "Create a USDC payment link." },
  { path: "/canary", name: "canary", marker: "Pay with Base Mainnet USDC." },
  { path: "/protect", name: "protect", marker: "Run preflight" },
  { path: "/docs", name: "docs", marker: "API documentation" },
  { path: "/developer", name: "developer", marker: "Developer Console" },
  { path: "/status", name: "status", marker: "LIVE STATUS" },
  { path: "/testnet-help", name: "testnet-help", marker: "Testnet" },
  { path: "/routes", name: "routes", marker: "route-readiness" },
  { path: "/meter", name: "meter", marker: "METER MODULE" },
  { path: "/receipts", name: "receipts", marker: "RECEIPTS" },
  { path: "/catalog", name: "catalog", marker: "SERVICE CATALOG" },
  { path: "/test", name: "test", marker: "Complete the test flow" },
  { path: "/docs/integration", name: "integration", marker: "INTEGRATION SAFETY" },
  { path: "/privacy", name: "privacy", marker: "Privacy Policy" },
  { path: "/terms", name: "terms", marker: "Terms of Service" },
];

const assets = [
  "/styles.css",
  "/app.js",
  "/guard.js",
  "/guard-builder.js",
  "/wallet.js",
  "/site-nav.js",
  "/guard-builder-wallet.js",
  "/mainnet-canary.js",
  "/routes.js",
  "/favicon.svg",
  "/marketing/hero-guard-builder.png",
  "/marketing/step-create.png",
  "/marketing/step-payment.png",
  "/marketing/step-verified.png",
];

const report = {
  baseUrl,
  at: new Date().toISOString(),
  http: [],
  assets: [],
  layout: [],
  consoleErrors: [],
  issues: [],
  passes: [],
};

function issue(severity, module, message) {
  report.issues.push({ severity, module, message });
}

function pass(message) {
  report.passes.push(message);
}

// --- HTTP checks ---
for (const page of pages) {
  try {
    const res = await fetch(`${baseUrl}${page.path}`, {
      signal: AbortSignal.timeout(25_000),
      redirect: "follow",
    });
    const html = await res.text();
    const entry = {
      path: page.path,
      status: res.status,
      ok: page.expect404 ? res.status === 404 : res.status === 200,
      hasPortalNav: html.includes('class="portal-nav"'),
      hasFooter: html.includes("site-footer"),
      hasMarker: page.marker ? html.includes(page.marker) : null,
      hasHan: /\p{Script=Han}/u.test(html),
    };
    report.http.push(entry);

    if (page.expect404) {
      if (res.status !== 404) {
        issue("medium", page.name, `Expected 404, got ${res.status}`);
      } else {
        pass(`${page.path} correctly missing (404)`);
      }
      continue;
    }
    if (res.status !== 200) {
      issue("high", page.name, `HTTP ${res.status}`);
    } else if (page.marker && !html.includes(page.marker)) {
      issue("high", page.name, `Missing marker: ${page.marker}`);
    } else if (!html.includes('class="portal-nav"')) {
      issue("medium", page.name, "Missing portal-nav (inconsistent shell)");
    } else if (!html.includes("site-footer")) {
      issue("medium", page.name, "Missing site-footer");
    } else if (/\p{Script=Han}/u.test(html)) {
      issue("low", page.name, "Page contains Chinese characters (product is English-first)");
    } else {
      pass(`${page.path} HTTP 200 + shell OK`);
    }
  } catch (error) {
    report.http.push({ path: page.path, error: String(error) });
    issue("high", page.name, `Fetch failed: ${error}`);
  }
}

for (const asset of assets) {
  try {
    const res = await fetch(`${baseUrl}${asset}`, {
      signal: AbortSignal.timeout(20_000,
      ),
    });
    report.assets.push({ path: asset, status: res.status });
    if (res.status !== 200) {
      issue("high", "assets", `${asset} returned ${res.status}`);
    } else {
      pass(`${asset} 200`);
    }
  } catch (error) {
    report.assets.push({ path: asset, error: String(error) });
    issue("high", "assets", `${asset} failed: ${error}`);
  }
}

// --- Playwright desktop + mobile ---
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage"],
});

async function auditViewport(label, viewport, isMobile) {
  const context = await browser.newContext({
    ...viewport,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ page: label, text: msg.text() });
  });
  page.on("pageerror", (err) => {
    errors.push({ page: label, text: err.message });
  });

  for (const p of pages.filter((x) => !x.expect404)) {
    await page.goto(`${baseUrl}${p.path}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await page.waitForTimeout(800);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        horizontalOverflow: doc.scrollWidth > doc.clientWidth + 2,
      };
    });

    const navVisible = await page.locator(".portal-nav").isVisible();
    const connectVisible = await page.locator("#nav-connect").isVisible();
    const menuToggle = page.locator(".nav-menu-toggle");
    const menuToggleVisible = await menuToggle.isVisible().catch(() => false);

    const layoutEntry = {
      viewport: label,
      path: p.path,
      horizontalOverflow: overflow.horizontalOverflow,
      scrollWidth: overflow.scrollWidth,
      clientWidth: overflow.clientWidth,
      navVisible,
      connectVisible,
      mobileMenuToggle: menuToggleVisible,
    };
    report.layout.push(layoutEntry);

    if (overflow.horizontalOverflow) {
      issue("medium", p.name, `${label}: horizontal scroll overflow (${overflow.scrollWidth}px > ${overflow.clientWidth}px)`);
    }

    if (isMobile) {
      if (menuToggleVisible) {
        await menuToggle.click();
        const panelOpen = await page.locator(".nav-mobile-panel.open").isVisible();
        if (!panelOpen) {
          issue("high", p.name, `${label}: mobile menu toggle does not open panel`);
        }
      } else if (!navVisible) {
        issue("medium", p.name, `${label}: nav hidden but no hamburger menu`);
      }
    }

    const shotPath = join(outDir, `${p.name}-${label}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
  }

  report.consoleErrors.push(...errors);
  await context.close();
}

await auditViewport("desktop", { viewport: { width: 1280, height: 800 } }, false);
await auditViewport("mobile", devices["iPhone 13"], true);

await browser.close();

for (const err of report.consoleErrors) {
  const text = err.text ?? "";
  if (
    text.includes("Failed to load resource") ||
    text.includes("404") ||
    text.includes("Content Security Policy") ||
    text.includes("TypeError")
  ) {
    issue("medium", "console", `${err.page}: ${text.slice(0, 200)}`);
  }
}

// Guard link flow (desktop only, no wallet)
try {
  const res = await fetch(`${baseUrl}/v1/guard-links`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      recipient: "0x2222222222222222222222222222222222222222",
      amountMicroUsdc: "1000000",
      purpose: "UI audit",
      expiryHours: 24,
      limitMicroUsdc: "1000000",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json();
  if (res.status !== 201 || !body.url) {
    issue("high", "guard-link-api", `POST /v1/guard-links failed: ${res.status}`);
  } else {
    pass("Guard Link API creates payment URL");
    const guardRes = await fetch(body.url.replace(baseUrl, ""), {
      signal: AbortSignal.timeout(20_000),
    });
    const guardHtml = await guardRes.text();
    if (guardRes.status !== 200 || !guardHtml.includes("Payment request")) {
      issue("high", "guard-link-page", "Payment request page failed to load");
    } else {
      pass("Guard Link payment page loads");
    }
  }
} catch (error) {
  issue("high", "guard-link-api", String(error));
}

// Narrative consistency checks
const homeHtml = await (await fetch(`${baseUrl}/`)).text();
const builderHtml = await (await fetch(`${baseUrl}/guard/create`)).text();
if (homeHtml.includes("bounded canary") || builderHtml.includes("bounded canary")) {
  issue("medium", "copy", 'Still mentions "bounded canary" on home or builder');
}
if (homeHtml.includes("Guard Link on Base Mainnet today")) {
  issue("high", "copy", "Overclaim: Guard Link on Base Mainnet today");
}

const meterHtml = await (await fetch(`${baseUrl}/meter`)).text();
if (meterHtml.includes("fail-closed until release gates pass")) {
  issue("medium", "meter", "Meter page still says mainnet fail-closed (contradicts /canary live copy)");
}

await writeFile(
  join(outDir, "audit-report.json"),
  JSON.stringify(report, null, 2),
);

console.log("\n=== LedgerGuard UI Audit ===");
console.log(`URL: ${baseUrl}`);
console.log(`Issues: ${report.issues.length}`);
console.log(`Passes: ${report.passes.length}`);
console.log(`Screenshots: ${outDir}`);

const bySeverity = { high: [], medium: [], low: [] };
for (const i of report.issues) bySeverity[i.severity].push(i);
for (const [sev, items] of Object.entries(bySeverity)) {
  if (items.length) {
    console.log(`\n[${sev.toUpperCase()}]`);
    for (const i of items) console.log(`  - [${i.module}] ${i.message}`);
  }
}

process.exit(report.issues.some((i) => i.severity === "high") ? 1 : 0);
