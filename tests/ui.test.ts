import { describe, expect, it } from "vitest";

import { guardBuilderBundle } from "../src/generated/guard-builder-bundle.js";

import { guardLinkBundle } from "../src/generated/guard-link-bundle.js";

import {

  demoJs,

  developerConsoleHtml,

  developerDocsHtml,

  guardBuilderHtml,

  guardLinkHtml,

  integrationBoundaryHtml,

  integrationsHtml,

  integrationStackHtml,

  mainnetCanaryHtml,

  portalHtml,

  siteCss,

  aboutHtml,

  privacyHtml,

  statusHtml,

  termsHtml,

  testerHtml,

  paymentsHtml,

  payHtml,

  testnetHelpHtml,

} from "../src/ui.js";



describe("browser demo experience", () => {

  it("labels the real-fund canary as experimental without production claims", () => {
    expect(mainnetCanaryHtml).toContain("CONTROLLED CANARY");
    expect(mainnetCanaryHtml).toContain("EXPERIMENTAL");
    expect(mainnetCanaryHtml).not.toContain("PRODUCTION READY");
    expect(mainnetCanaryHtml).not.toContain("All production gates");
  });

  it("invalidates the displayed result when inputs change", () => {

    expect(demoJs).toContain('form.addEventListener("input"');

    expect(demoJs).toContain("The input changed. Run the check again.");

  });



  it("clears stale output when native form validation blocks submission", () => {

    expect(demoJs).toContain('form.addEventListener("invalid"');

    expect(demoJs).toContain("Correct the invalid input");

  });

  it("gives Guard Link validation feedback and invalidates stale links", () => {
    expect(guardBuilderBundle).toContain("Complete required fields");
    expect(guardBuilderBundle).toContain("Payment details changed");
    expect(guardBuilderBundle).toContain("Create a new link");
  });

  it("marks aggregate status degraded when enabled shadow monitoring fails", () => {
    const html = statusHtml({
      ready: true,
      chainId: 5042002,
      blockNumber: "1",
      x402: true,
      mainnet: false,
      shadow: {
        ok: false,
        enabled: true,
        chainId: 5042,
        headBlock: null,
        healthyRpcs: 0,
        healthyObservers: 0,
      },
    });
    expect(html).toContain("Some monitored services are degraded");
    expect(html).not.toContain("All monitored services are operational");
  });



  it("routes people to readable pages instead of raw JSON", () => {

    expect(portalHtml).toContain('href="/guard/create"');

    expect(portalHtml).toContain('href="/canary"');

    expect(portalHtml).toContain('href="/status"');

    expect(portalHtml).toContain('href="/docs"');

    expect(portalHtml).toContain('href="/payments"');

    expect(portalHtml).toContain('href="/pay"');

    expect(portalHtml).toContain("ArcScan");

    expect(portalHtml).not.toContain('href="/routes"');

    expect(portalHtml).not.toContain('id="nav-connect"');

    expect(portalHtml).toContain('href="/privacy"');

    expect(portalHtml).toContain('href="/terms"');

    expect(portalHtml).toContain('href="/about"');

    expect(portalHtml).toContain('class="brand-mark"');

    expect(portalHtml).toContain('src="/brand/logo-64.png?v=5"');

    expect(portalHtml).toContain('width="44" height="44"');

    expect(portalHtml).toContain('class="portal-nav-actions"');

    expect(portalHtml).toContain('id="nav-menu-toggle"');

    expect(portalHtml).toContain('id="nav-mobile-panel"');

    expect(portalHtml).toContain("/wallet.js");

    expect(portalHtml).toContain("/site-nav.js");

    expect(portalHtml).not.toContain("connectWallet()");

    expect(portalHtml).toContain("https://x.com/HuiLibaa");

    expect(portalHtml).not.toMatch(/\sstyle=/);

    expect(developerDocsHtml).toContain('href="/developer"');

    expect(developerDocsHtml).toContain('href="/docs/integration"');

    expect(developerDocsHtml).not.toContain(

      '<a href="/openapi.json">OpenAPI</a>',

    );

  });



  it("renders plain-language decisions and preserves technical details", () => {

    expect(demoJs).toContain("A defined risk was detected.");

    expect(demoJs).toContain("JSON.stringify(body,null,2)");

  });



  it("explains that machine JSON is intentional", () => {

    expect(developerDocsHtml).toContain("machine-readable file");

    expect(testerHtml("1000")).toContain("1000 micro-USDC");

  });



  it("uses English as the public default language", () => {

    for (const html of [

      portalHtml,

      developerDocsHtml,

      testerHtml("1000"),

      guardBuilderHtml,

    ]) {

      expect(html).toContain('<html lang="en">');

      expect(html).not.toMatch(/\p{Script=Han}/u);

    }

  });



  it("loads privacy-preserving production analytics on human pages", () => {

    for (const html of [

      portalHtml,

      developerDocsHtml,

      testerHtml("1000"),

      guardBuilderHtml,

    ]) {

      expect(html).toContain('src="/_vercel/insights/script.js"');

      expect(html).toContain('href="/favicon.svg?v=5"');

      expect(html).toContain('href="/favicon.png?v=5"');

      expect(html).toContain('href="/favicon.ico?v=5"');

    }

  });



  it("provides one public testing and feedback path", () => {

    expect(testerHtml("1000")).toContain('href="/developer"');

    expect(testerHtml("1000")).toContain("/v1/preflight");

    expect(testerHtml("1000")).toContain("/v1/paid/network-risk");

    expect(testerHtml("1000")).toContain(

      "https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose",

    );

  });



  it("shows the public testnet payment recipient when configured", () => {

    const seller = "0xF1437D9cD304ae49F2Ec005AC967813b3a7C466C";

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

    expect(html).toContain("preflight-status-bar");

    expect(html).toContain("PREFLIGHT CHECK");

    expect(html).toContain("Payment request");

    expect(html).toContain("Invoice &amp; delivery");

    expect(html).not.toContain("Invoice & delivery");

    expect(html).toContain("REVIEW");

    expect(html).toContain("request-123");

    expect(html).toContain("Example Agent");

    expect(html).toContain("Connect wallet");

    expect(html).toContain('src="/guard.js"');

    expect(html).toContain("/site-nav.js");

    expect(html).toContain('id="payment-complete"');

    expect(html).toContain("Confirm payment complete");

    expect(html).toContain("Create your payment link");

    expect(html).toContain('id="guard-cta"');

    expect(html).toContain('id="guard-cta-link"');

    expect(html).toContain('id="guard-cta-summary"');

  });



  it("creates and completes Guard Links without server-side signing", () => {

    expect(portalHtml).toContain('href="/guard/create"');

    expect(guardBuilderHtml).toContain("USDC PAYMENT LINKS · ARC TESTNET");

    expect(guardBuilderHtml).toContain("no real money");

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

    expect(guardBuilderHtml).toContain("5-minute setup guide");

    expect(guardBuilderHtml).toContain("template-chip");

    expect(guardBuilderHtml).toContain('href="/payments"');

    expect(guardBuilderBundle).toContain('fetch("/v1/guard-links"');

    expect(guardBuilderBundle).toContain("guard-qr-canvas");

    expect(guardLinkBundle).toContain("eth_sendTransaction");

    expect(guardLinkBundle).toContain('fetch("/v1/evidence"');

    expect(guardLinkBundle).toContain("guard-cta-highlight");

    expect(guardLinkBundle).toContain("guard-cta-verified");

    expect(guardLinkBundle).toContain("verify-evidence");

    expect(guardLinkBundle).toContain("verified-payment");

    expect(guardLinkBundle).not.toMatch(/privateKey|seed phrase/i);

  });



  it("uses the shared portal navigation on key human pages", () => {

    expect(developerDocsHtml).toContain('id="nav-connect"');

    expect(developerDocsHtml).toContain('id="nav-menu-toggle"');

    expect(developerDocsHtml).toContain("/site-nav.js");

    for (const html of [

      testerHtml("1000"),

      developerConsoleHtml({

        storageReady: true,

        registrationEnabled: true,

      }),

      integrationBoundaryHtml,

      paymentsHtml,

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



  it("leads with a plain-language payment safety promise on the portal", () => {

    expect(portalHtml).toContain("Review a stablecoin payment");

    expect(portalHtml).toContain("before you sign");

    expect(portalHtml).toContain("Independent open-source security project");

    expect(portalHtml).toContain("not affiliated with Ledger SAS");

    expect(portalHtml).toContain('href="/pay"');

    expect(portalHtml).toContain("Review a payment link");

    expect(portalHtml).toContain("Create a test request");

    expect(portalHtml).toContain("HOW IT WORKS");

    expect(portalHtml).toContain('id="how-it-works"');

    expect(portalHtml).toContain("/marketing/hero-guard-builder.png");

    expect(portalHtml).toContain("USDC PAYMENT LINKS · ARC TESTNET");

    expect(portalHtml).toContain("no real money");

    expect(portalHtml).toContain("What is USDC?");

    expect(portalHtml).not.toContain("USDC PAYMENT LINKS · BASE + ARC");

    expect(portalHtml).not.toContain("how-cta");

    expect(portalHtml).not.toContain("portal-developers");

    expect(portalHtml).not.toContain("FOR DEVELOPERS");

  });



  it("publishes the pay entry page for pasted links", () => {

    expect(payHtml).toContain("Pay with USDC");

    expect(payHtml).toContain('id="pay-form"');

    expect(payHtml).toContain('id="pay-recent"');

    expect(payHtml).toContain("/pay.js");

  });



  it("publishes the official X account on the public portal", () => {

    expect(portalHtml).toContain("Follow on X @HuiLibaa");

    expect(portalHtml).not.toContain('rel="me noreferrer">X @HuiLibaa</a></div>');

    expect(portalHtml).toContain('rel="me noreferrer"');

  });



  it("publishes wallet setup and payment check pages", () => {

    expect(testnetHelpHtml).toContain("Fund Arc Testnet USDC");

    expect(testnetHelpHtml).toContain('id="guide-arc"');

    expect(testnetHelpHtml).not.toContain('id="guide-base"');

    expect(testnetHelpHtml).not.toContain('href="/routes"');

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

    expect(aboutHtml).toContain("protocol-neutral");
    expect(aboutHtml).toContain("Network adapters");

    expect(aboutHtml).toContain("separately gated canary");

    expect(aboutHtml).toContain("disabled by default");

    expect(aboutHtml).not.toContain("live and operational");

    expect(aboutHtml).toContain("independent developer project");

    expect(privacyHtml).toContain("non-custodial");

    expect(termsHtml).toContain("Terms of Service");

    expect(termsHtml).toContain("ALLOW");

    expect(termsHtml).toContain("primary product path");

  });



  it("ships responsive CSS and consistent mobile footer across human pages", () => {

    expect(siteCss).toContain("@media(max-width:900px)");

    expect(siteCss).toContain("@media(max-width:760px)");

    expect(siteCss).toContain("@media(max-width:480px)");

    expect(siteCss).toContain(".footer-partners");

    expect(siteCss).toContain(".panel dl{");

    expect(siteCss).toContain("overflow-x:clip");

    expect(siteCss).toContain(".portal-dual-cta{flex-direction:column");

    for (const html of [

      portalHtml,

      guardBuilderHtml,

      payHtml,

      paymentsHtml,

      developerDocsHtml,

      integrationsHtml,

      integrationStackHtml,

      aboutHtml,

    ]) {

      expect(html).toContain('name="viewport"');

      expect(html).toContain("footer-partners");

      expect(html).toContain("Payment intent safety");

    }

  });



  it("uses payment intent safety and x402-compatible docs positioning", () => {

    expect(portalHtml).toContain("Payment intent safety");

    expect(developerDocsHtml).toContain("COMPATIBLE STANDARDS");

    expect(developerDocsHtml).toContain("compatible oracle");

    expect(integrationStackHtml).toContain("PREFLIGHT_RECORD_MAPPING.md");

  });

});


