import { describe, expect, it } from "vitest";
import {
  catalogHtml,
  demoHtml,
  demoJs,
  developerConsoleHtml,
  developerDocsHtml,
  guardBuilderHtml,
  guardBuilderJs,
  guardLinkHtml,
  guardLinkJs,
  portalHtml,
  testerHtml,
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
    expect(portalHtml).toContain('href="/protect"');
    expect(portalHtml).toContain('href="/routes"');
    expect(portalHtml).toContain('href="/meter"');
    expect(portalHtml).toContain('href="/receipts"');
    expect(portalHtml).toContain('href="/developers"');
    expect(portalHtml).toContain('href="/guard/create"');
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
      expect(html).toContain('href="/favicon.svg"');
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
    expect(html).toContain("Payment intent receipt");
    expect(html).toContain("Invoice &amp; delivery");
    expect(html).not.toContain("Invoice & delivery");
    expect(html).toContain("REVIEW");
    expect(html).toContain("request-123");
    expect(html).toContain("Example Agent");
    expect(html).toContain("Connect test wallet");
    expect(html).toContain('src="/guard.js"');
  });

  it("creates and completes Guard Links without server-side signing", () => {
    expect(guardBuilderHtml).toContain('id="guard-builder"');
    expect(guardBuilderHtml).toContain("Identity boundary");
    expect(guardBuilderJs).toContain('fetch("/v1/guard-links"');
    expect(guardLinkJs).toContain('"eth_sendTransaction"');
    expect(guardLinkJs).toContain('fetch("/v1/evidence"');
    expect(guardLinkJs).not.toMatch(/privateKey|seed phrase/i);
    expect(() => new Function(guardBuilderJs)).not.toThrow();
    expect(() => new Function(guardLinkJs)).not.toThrow();
  });

  it("publishes the official X account on the public portal", () => {
    expect(portalHtml).toContain("Official X @HuiLibaa");
    expect(portalHtml).toContain('rel="me noreferrer"');
  });
});
