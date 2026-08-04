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
  { path: "/", name: "home", marker: "Runtime authorization" },
  { path: "/guard/create", name: "guard-create", marker: "Create a payment link." },
  { path: "/pay", name: "pay", marker: "Pay with USDC" },
  { path: "/canary", name: "canary", marker: "Controlled Base Mainnet payment canary.", optional503: true },
  { path: "/docs", name: "docs", marker: "API documentation" },
  { path: "/about", name: "about", marker: "What we build" },
  { path: "/integrations", name: "integrations", marker: "INTEGRATIONS" },
  { path: "/catalog", name: "catalog", marker: "PRICING" },
  { path: "/pilot", name: "pilot", marker: "DESIGN PARTNER" },
  { path: "/developer", name: "developer", marker: "Developer Console" },
  { path: "/status", name: "status", marker: "LIVE STATUS" },
  { path: "/payments", name: "payments", marker: "Check whether a payment arrived." },
  { path: "/testnet-help", name: "testnet-help", marker: "Set up your wallet" },
  { path: "/test", name: "test", marker: "Complete the test flow" },
  { path: "/docs/integration", name: "integration", marker: "INTEGRATION SAFETY" },
  { path: "/docs/integration-stack", name: "integration-stack", marker: "INTEGRATION STACK" },
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
  "/pay.js",
  "/mainnet-canary.js",
  "/favicon.svg",
  "/brand/logo-64.png",
  "/brand/logo-192.png",
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
  internalLinks: [],
  controls: [],
  layout: [],
  consoleErrors: [],
  issues: [],
  passes: [],
};

function issue(severity, module, message) {
  report.issues.push({ severity, module, message });
}

const internalLinkPaths = new Set();

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
      ok: page.expect404
        ? res.status === 404
        : page.optional503
          ? res.status === 200 || res.status === 503
          : res.status === 200,
      hasPortalNav: html.includes('class="portal-nav"'),
      hasFooter: html.includes("site-footer"),
      hasMarker: page.marker ? html.includes(page.marker) : null,
      hasHan: /\p{Script=Han}/u.test(html),
    };
    report.http.push(entry);
    for (const match of html.matchAll(/href=["']([^"'#]+)["']/g)) {
      try {
        const decodedHref = match[1].replaceAll("&amp;", "&");
        const target = new URL(decodedHref, `${baseUrl}${page.path}`);
        if (target.origin === new URL(baseUrl).origin) internalLinkPaths.add(`${target.pathname}${target.search}`);
      } catch {
        issue("medium", page.name, `Invalid internal href: ${match[1]}`);
      }
    }

    if (page.expect404) {
      if (res.status !== 404) {
        issue("medium", page.name, `Expected 404, got ${res.status}`);
      } else {
        pass(`${page.path} correctly missing (404)`);
      }
      continue;
    }
    if (page.optional503 && res.status === 503) {
      pass(`${page.path} safely disabled (503)`);
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

for (const path of [...internalLinkPaths].sort()) {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });
    const allowedFailClosed =
      (path.startsWith("/canary") || path.startsWith("/v1/shadow/arc-mainnet")) && res.status === 503;
    report.internalLinks.push({ path, status: res.status });
    if (!res.ok && !allowedFailClosed) issue("high", "internal-links", `${path} returned ${res.status}`);
    else pass(`${path} internal destination reachable`);
  } catch (error) {
    report.internalLinks.push({ path, error: String(error) });
    issue("high", "internal-links", `${path} failed: ${error}`);
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

async function auditViewport(label, viewport, isMobile, selectedPages = pages) {
  const context = await browser.newContext({
    ...viewport,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  if (baseUrl.startsWith("http://127.0.0.1") || baseUrl.startsWith("http://localhost")) {
    await page.route("**/_vercel/insights/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "/* Vercel Insights is unavailable in local audits. */",
      }),
    );
  }
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("Failed to load resource")) {
      errors.push({ page: label, text: msg.text() });
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push({
        page: label,
        text: `HTTP ${response.status()} ${response.url()}`,
      });
    }
  });
  page.on("pageerror", (err) => {
    errors.push({ page: label, text: err.message });
  });

  const availablePaths = new Set(
    report.http.filter((entry) => entry.status === 200).map((entry) => entry.path),
  );
  for (const p of selectedPages.filter((x) => !x.expect404 && availablePaths.has(x.path))) {
    await page.goto(`${baseUrl}${p.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await page.waitForTimeout(200);

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

    if (label === "desktop") {
      const controls = await page.locator("button:not([disabled]), input[type=submit]:not([disabled])").evaluateAll((nodes) =>
        nodes.map((node) => {
          const element = node;
          return {
            label: (element.getAttribute("aria-label") || element.textContent || element.getAttribute("value") || "").trim(),
            id: element.id,
            type: element.getAttribute("type"),
            inForm: Boolean(element.closest("form")),
            ariaControls: element.getAttribute("aria-controls"),
            hasDataHook: [...element.attributes].some((attribute) => attribute.name.startsWith("data-")),
          };
        }),
      );
      report.controls.push({ path: p.path, controls });
      for (const control of controls) {
        if (!control.label) issue("high", p.name, "Enabled interactive control has no accessible label");
        if (!control.id && !control.inForm && !control.ariaControls && !control.hasDataHook) {
          issue("medium", p.name, `Control lacks an explicit interaction hook: ${control.label}`);
        }
      }
    }

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

const breakpointWidths = [899, 759, 479];
const breakpointPages = pages.filter((page) =>
  ["/", "/guard/create", "/developer", "/status"].includes(page.path),
);
for (const width of breakpointWidths) {
  await auditViewport(
    `bp-${width}`,
    { viewport: { width, height: 844 } },
    width <= 900,
    breakpointPages,
  );
}

// --- Real interaction acceptance (not just screenshots) ---
const interactionContext = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
const interactionPage = await interactionContext.newPage();

async function expectVisible(selector, module, message) {
  const visible = await interactionPage.locator(selector).isVisible().catch(() => false);
  if (!visible) issue("high", module, message);
  return visible;
}

try {
  await interactionPage.goto(`${baseUrl}/guard/create`, { waitUntil: "domcontentloaded" });
  await interactionPage.getByRole("button", { name: "Create payment link" }).click();
  if (!(await interactionPage.locator("#guard-builder-result strong").textContent())?.includes("Complete required fields")) {
    issue("high", "guard-create", "Required-field submission has no application-level feedback");
  } else {
    pass("Guard builder explains missing required fields");
  }

  await interactionPage.getByRole("button", { name: "Freelance invoice" }).click();
  const templateAmount = await interactionPage.locator("#guard-amount").inputValue();
  const templatePurpose = await interactionPage.locator("#guard-purpose").inputValue();
  if (templateAmount !== "50.00" || templatePurpose !== "Freelance invoice") {
    issue("high", "guard-create", "Payment template did not update amount and purpose");
  } else {
    pass("Guard Link templates update the form");
  }

  await interactionPage.locator("#guard-recipient").fill("0x2222222222222222222222222222222222222222");
  await interactionPage.getByRole("button", { name: "Create payment link" }).click();
  await interactionPage.locator("#guard-builder-result strong").filter({ hasText: "Payment link ready" }).waitFor();
  await expectVisible("#guard-builder-actions", "guard-create", "Created Guard Link actions are hidden");
  await expectVisible("#guard-created-url", "guard-create", "Created Guard Link URL is hidden");
  pass("Guard Link form creates a shareable request");

  await interactionPage.locator("#guard-purpose").fill("Changed after creation");
  const changedHeading = await interactionPage.locator("#guard-builder-result strong").textContent();
  const staleActionsVisible = await interactionPage.locator("#guard-builder-actions").isVisible();
  if (!changedHeading?.includes("Payment details changed") || staleActionsVisible) {
    issue("high", "guard-create", "Editing payment details leaves a stale shareable link visible");
  } else {
    pass("Editing payment details invalidates the old Guard Link");
  }

  await interactionPage.goto(`${baseUrl}/pay`, { waitUntil: "domcontentloaded" });
  await interactionPage.getByRole("button", { name: "Open payment" }).click();
  if (!(await interactionPage.locator("#pay-result strong").textContent())?.includes("Paste a link")) {
    issue("high", "pay", "Empty payment-link submission has no feedback");
  }
  await interactionPage.locator("#pay-url").fill("https://example.com/not-a-guard-link");
  await interactionPage.getByRole("button", { name: "Open payment" }).click();
  if (!(await interactionPage.locator("#pay-result strong").textContent())?.includes("Invalid payment link")) {
    issue("high", "pay", "Invalid payment link has no feedback");
  } else {
    pass("Pay page explains empty and invalid links");
  }

  await interactionPage.goto(`${baseUrl}/payments`, { waitUntil: "domcontentloaded" });
  await interactionPage.getByRole("button", { name: "Open ArcScan history" }).click();
  if (!(await interactionPage.locator("#payments-address-result strong").textContent())?.includes("Invalid address")) {
    issue("high", "payments", "Invalid receiving address has no feedback");
  }
  await interactionPage.locator("#payments-tx").fill("0x1234");
  await interactionPage.getByRole("button", { name: "Verify onchain result" }).click();
  if (!(await interactionPage.locator("#payments-verify-result strong").textContent())?.includes("Invalid transaction hash")) {
    issue("high", "payments", "Invalid transaction hash has no feedback");
  } else {
    pass("Payments page explains invalid address and transaction hash");
  }

  await interactionPage.goto(`${baseUrl}/developer`, { waitUntil: "domcontentloaded" });
  const loadAccountButton = interactionPage.getByRole("button", { name: "Load account" });
  if (await loadAccountButton.isEnabled()) {
    await interactionPage.locator("#developer-key").fill(`lg_test_${"a".repeat(32)}`);
    await loadAccountButton.click();
    // Production serverless storage can cold-start more slowly than page HTML.
    await interactionPage
      .locator("#developer-title")
      .filter({ hasText: "Could not load account" })
      .waitFor({ timeout: 60_000 });
    pass("Developer console reports an invalid API key");
  } else {
    const developerText = await interactionPage.locator("main").innerText();
    if (!/unavailable|disabled|not configured/i.test(developerText)) {
      issue("high", "developer", "Developer actions are disabled without an explanatory status");
    } else {
      pass("Developer console explains why self-service is unavailable");
    }
  }

  await interactionPage.goto(`${baseUrl}/status`, { waitUntil: "domcontentloaded" });
  const statusText = await interactionPage.locator(".status-list").innerText();
  const statusHeading = await interactionPage.locator("h1").innerText();
  if (statusText.includes("DEGRADED") && statusHeading.includes("All monitored services are operational")) {
    issue("high", "status", "Aggregate status says operational while a monitored service is degraded");
  } else {
    pass("Aggregate status matches monitored service state");
  }
} catch (error) {
  issue("high", "interaction-audit", String(error));
} finally {
  await interactionContext.close();
}

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
      issuer: "UI audit",
      recipient: "0x2222222222222222222222222222222222222222",
      amount: "1.00",
      limit: "1.00",
      purpose: "UI audit",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json();
  if (res.status !== 201 || !body.url) {
    issue("high", "guard-link-api", `POST /v1/guard-links failed: ${res.status}`);
  } else {
    pass("Guard Link API creates payment URL");
    const guardUrl = body.url.startsWith("http")
      ? body.url
      : `${baseUrl}${body.url.startsWith("/") ? body.url : `/${body.url}`}`;
    const guardRes = await fetch(guardUrl, {
      signal: AbortSignal.timeout(20_000),
    });
    const guardHtml = await guardRes.text();
    if (guardRes.status !== 200 || !guardHtml.includes("Payment request")) {
      issue("high", "guard-link-page", "Payment request page failed to load");
    } else if (!guardHtml.includes("Connect wallet")) {
      issue("high", "guard-link-page", "Payment page missing Connect wallet CTA");
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
