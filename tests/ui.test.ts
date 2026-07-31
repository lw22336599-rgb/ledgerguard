import { describe, expect, it } from "vitest";
import { guardBuilderBundle } from "../src/generated/guard-builder-bundle.js";
import { guardLinkBundle } from "../src/generated/guard-link-bundle.js";
import {
  catalogHtml,
  demoHtml,
  demoJs,
  developerConsoleHtml,
  developerDocsHtml,
  guardBuilderHtml,
  guardLinkHtml,
  integrationBoundaryHtml,
  meterHtml,
  portalHtml,
  aboutHtml,
  privacyHtml,
  receiptsHtml,
  statusHtml,
  termsHtml,
  testerHtml,
  paymentsHtml,
  testnetHelpHtml,
} from "../src/ui.js";

describe("browser demo experience", () => {
  it("invalidates the displayed result when inputs change", () => {
    expect(demoJs).toContain('form.addEventListener("input"');
    expect(demoJs).toContain("The input changed. Run the check again.");
  });

  it("clears stale output when native form validation blocks submission", () => {
    expect(demoJs).toContain('form.addEventListener("invalid"');
    expect(demoJs).toContain("Correct the invalid input");
  });

  it("routes people to readable pages instead of raw JSON", () => {
    expect(portalHtml).toContain('href="/guard/create"');
    expect(portalHtml).toContain('href="/canary"');
    expect(portalHtml).toContain('href="/status"');
    expect(portalHtml).toContain('href="/docs"');
    expect(portalHtml).toContain('href="/testnet-help"');
    expect(portalHtml).toContain('href="/payments"');
    expect(portalHtml).toContain("ArcScan");
    expect(portalHtml).toContain('href="/routes"');
    expect(portalHtml).toContain('id="nav-connect"');
    expect(portalHtml).toContain('href="/privacy"');
    expect(portalHtml).toContain('href="/terms"');
    expect(portalHtml).toContain('href="/about"');
    expect(portalHtml).toContain('class="brand-mark"');
    expect(portalHtml).toContain('src="/favicon.png?v=4"');
    expect(portalHtml).toContain('class="portal-nav-actions"');
    expect(portalHtml).toContain('id="nav-menu-toggle"');
    expect(portalHtml).toContain('id="nav-mobile-panel"');
    expect(portalHtml).toContain("/wallet.js");
    expect(portalHtml).toContain("/site-nav.js");
    expect(portalHtml).not.toContain("connectWallet()");
    expect(portalHtml).toContain("https://x.com/HuiLibaa");
    expect(demoHtml).toContain('href="/docs"');
    expect(demoHtml).toContain('href="/catalog"');
    expect(demoHtml).toContain('href="/status"');
    expect(demoHtml).not.toContain(
      '<a href="/openapi.json">OpenAPI</a>',
    );
  });

  it("renders plain-language decisions and preserves technical details", () => {
    expect(demoJs).toContain("A defined risk was detected.");
    expect(demoJs).toContain("JSON.stringify(body,null,2)");
    expect(demoHtml).toContain("result-details");
  });

  it("explains that machine JSON is intentional", () => {
    expect(developerDocsHtml).toContain("machine-readable file");
    expect(catalogHtml("1000")).toContain("1000 micro-USDC");
  });

  it("uses English as the public default language", () => {
    for (const html of [
      demoHtml,
      portalHtml,
      developerDocsHtml,
      catalogHtml("1000"),
      testerHtml("1000"),
      guardBuilderHtml,
    ]) {
      expect(html).toContain('<html lang="en">');
      expect(html).not.toMatch(/\p{Script=Han}/u);
    }
  });

  it("loads privacy-preserving production analytics on human pages", () => {
    for (const html of [
      demoHtml,
      portalHtml,
      developerDocsHtml,
      catalogHtml("1000"),
      testerHtml("1000"),
      guardBuilderHtml,
    ]) {
      expect(html).toContain('src="/_vercel/insights/script.js"');
      expect(html).toContain('href="/favicon.svg?v=4"');
      expect(html).toContain('href="/favicon.png?v=4"');
      expect(html).toContain('href="/favicon.ico?v=4"');
    }
  });

  it("provides one public testing and feedback path", () => {
    expect(demoHtml).toContain('href="/test"');
    expect(testerHtml("1000")).toContain("/v1/preflight");
    expect(testerHtml("1000")).toContain("/v1/paid/network-risk");
    expect(testerHtml("1000")).toContain(
      "https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose",
    );
  });

  it("shows the public testnet payment recipient when configured", () => {
    const seller = "0xF1437D9cD304ae49F2Ec005AC967813b3a7C466C";
    expect(catalogHtml("1000", seller)).toContain(seller);
    expect(testerHtml("1000", seller)).toContain(seller);
  });

  it("offers a non-enforcing shadow action in the developer console", () => {
    expect(
      developerConsoleHtml({
        storageReady: true,
        registrationEnabled: true,
      }),
    ).toContain("Run non-enforcing shadow");
  });

  it("renders a no-input Guard Link receipt with escaped intent details", () => {
    const html = guardLinkHtml({
      issuer: "Example Agent",
      intentId: "a1b2c3d4e5f6",
      payer: "Not declared",
      recipient: "0x2222222222222222222222222222222222222222",
      amount: "1.25",
      limit: "2",
      purpose: "Invoice & delivery",
      decision: "REVIEW",
      findings: [{ code: "SIMULATION_REQUIRED", message: "Review first" }],
      requestId: "request-123",
    });
    expect(html).toContain("Payment request");
    expect(html).toContain("Invoice &amp; delivery");
    expect(html).not.toContain("Invoice & delivery");
    expect(html).toContain("REVIEW");
    expect(html).toContain("request-123");
    expect(html).toContain("Example Agent");
    expect(html).toContain("Connect test wallet");
    expect(html).toContain('src="/guard.js"');
    expect(html).toContain("/site-nav.js");
    expect(html).toContain("Create your Guard Link");
    expect(html).toContain('id="guard-cta"');
    expect(html).toContain('id="guard-cta-link"');
    expect(html).toContain('id="guard-cta-summary"');
  });

  it("creates and completes Guard Links without server-side signing", () => {
    expect(portalHtml).toContain('href="/guard/create"');
    expect(guardBuilderHtml).toContain("USDC PAYMENT LINKS · ARC TESTNET");
    expect(guardBuilderHtml).toContain("primary product path");
    expect(guardBuilderHtml).toContain('href="/canary"');
    expect(guardBuilderHtml).not.toContain("USDC PAYMENT LINKS · BASE + ARC");
    expect(guardBuilderHtml).toContain("/site-nav.js");
    expect(guardBuilderHtml).toContain("/guard-builder-wallet.js");
    expect(guardBuilderHtml).toContain("wallet-status-card");
    expect(guardLinkHtml({
      issuer: "Example Agent",
      intentId: "a1b2c3d4e5f6",
      payer: "Not declared",
      recipient: "0x2222222222222222222222222222222222222222",
      amount: "1.25",
      limit: "2",
      purpose: "Invoice & delivery",
      decision: "REVIEW",
      findings: [{ code: "SIMULATION_REQUIRED", message: "Review first" }],
      requestId: "request-123",
    })).toContain("/wallet.js");
    expect(guardBuilderHtml).toContain("/guard-builder.js");
    expect(guardBuilderHtml).toContain("guard-qr-canvas");
    expect(guardBuilderHtml).toContain("Advanced options");
    expect(guardBuilderHtml).toContain("guard-verified-notice");
    expect(guardBuilderHtml).toContain("Your receiving address");
    expect(guardBuilderHtml).toContain("Need Arc Testnet USDC?");
    expect(guardBuilderHtml).toContain('href="/payments"');
    expect(guardBuilderBundle).toContain('fetch("/v1/guard-links"');
    expect(guardBuilderBundle).toContain("guard-qr-canvas");
    expect(guardLinkBundle).toContain("eth_sendTransaction");
    expect(guardLinkBundle).toContain('fetch("/v1/evidence"');
    expect(guardLinkBundle).toContain("guard-cta-highlight");
    expect(guardLinkBundle).toContain("guard-cta-verified");
    expect(guardLinkBundle).toContain("verified-payment");
    expect(guardLinkBundle).not.toMatch(/privateKey|seed phrase/i);
  });

  it("uses the shared portal navigation on key human pages", () => {
    expect(demoHtml).toContain('id="nav-connect"');
    expect(demoHtml).toContain("/site-nav.js");
    expect(developerDocsHtml).toContain('id="nav-menu-toggle"');
    expect(developerDocsHtml).toContain("/site-nav.js");
    for (const html of [
      catalogHtml("1000"),
      testerHtml("1000"),
      developerConsoleHtml({
        storageReady: true,
        registrationEnabled: true,
      }),
      integrationBoundaryHtml,
      meterHtml,
      receiptsHtml,
    ]) {
      expect(html).toContain('class="portal-nav"');
      expect(html).toContain('id="nav-connect"');
      expect(html).toContain("/site-nav.js");
    }
    expect(
      statusHtml({
        ready: true,
        chainId: 5042002,
        blockNumber: "1",
        x402: true,
        mainnet: false,
        shadow: {
          ok: false,
          enabled: false,
          chainId: 5042,
          headBlock: null,
          healthyRpcs: 0,
          healthyObservers: 0,
        },
      }),
    ).toContain("/site-nav.js");
  });

  it("shows a danger badge when developer self-service is unavailable", () => {
    expect(
      developerConsoleHtml({
        storageReady: false,
        registrationEnabled: false,
      }),
    ).toContain('class="badge danger"');
    expect(
      developerConsoleHtml({
        storageReady: true,
        registrationEnabled: true,
      }),
    ).not.toContain('class="badge danger"');
  });

  it("bridges Meter and Receipts through branded pages", () => {
    expect(meterHtml).toContain("Open Meter app");
    expect(meterHtml).toContain("https://arc-meter-xi.vercel.app/");
    expect(meterHtml).toContain("Base Mainnet x402 USDC is live at");
    expect(meterHtml).not.toContain("fail-closed until release gates pass");
    expect(receiptsHtml).toContain("Open receipt explorer");
    expect(receiptsHtml).toContain("https://arc-meter-xi.vercel.app/#flow");
  });

  it("leads with a plain-language payment link promise on the portal", () => {
    expect(portalHtml).toContain("Send a USDC payment link.");
    expect(portalHtml).toContain("Create a Guard Link");
    expect(portalHtml).toContain("HOW IT WORKS");
    expect(portalHtml).toContain("/marketing/hero-guard-builder.png");
    expect(portalHtml).toContain("USDC PAYMENT LINKS · ARC TESTNET");
    expect(portalHtml).toContain("primary product path");
    expect(portalHtml).toContain("Arc-first &middot; Guard Links on Arc Testnet");
    expect(portalHtml).toContain("Arc Testnet");
    expect(portalHtml).not.toContain("USDC PAYMENT LINKS · BASE + ARC");
  });

  it("publishes the official X account on the public portal", () => {
    expect(portalHtml).toContain("Follow on X @HuiLibaa");
    expect(portalHtml).not.toContain('rel="me noreferrer">X @HuiLibaa</a></div>');
    expect(portalHtml).toContain('rel="me noreferrer"');
  });

  it("publishes wallet setup and payment check pages", () => {
    expect(testnetHelpHtml).toContain("Fund Arc Testnet USDC");
    expect(testnetHelpHtml).toContain('id="guide-arc"');
    expect(testnetHelpHtml).toContain('id="guide-base"');
    expect(testnetHelpHtml).toContain("/testnet-help.js");
    expect(paymentsHtml).toContain("Verify a Guard Link payment");
    expect(paymentsHtml).toContain('id="payments-verify-form"');
    expect(paymentsHtml).toContain("/payments.js");
    expect(paymentsHtml).toContain("NON-CUSTODIAL");
  });

  it("publishes legal pages and a branded nav logo", () => {
    for (const html of [aboutHtml, privacyHtml, termsHtml]) {
      expect(html).toContain('class="portal-nav"');
      expect(html).toContain('class="legal-prose panel"');
      expect(html).toContain('class="brand-mark"');
      expect(html).toContain('href="/privacy"');
      expect(html).toContain('href="/terms"');
    }
    expect(aboutHtml).toContain("Arc-first");
    expect(aboutHtml).toContain("live and operational");
    expect(aboutHtml).not.toContain("bounded x402 capability demo");
    expect(aboutHtml).toContain("independent developer project");
    expect(privacyHtml).toContain("non-custodial");
    expect(termsHtml).toContain("Terms of Service");
    expect(termsHtml).toContain("ALLOW");
    expect(termsHtml).toContain("primary product path");
  });
});

