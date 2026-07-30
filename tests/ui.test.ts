import { describe, expect, it } from "vitest";
import {
  catalogHtml,
  demoHtml,
  demoJs,
  developerConsoleHtml,
  developerDocsHtml,
  guardLinkHtml,
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
      developerDocsHtml,
      catalogHtml("1000"),
      testerHtml("1000"),
    ]) {
      expect(html).toContain('<html lang="en">');
      expect(html).not.toMatch(/\p{Script=Han}/u);
    }
  });

  it("loads privacy-preserving production analytics on human pages", () => {
    for (const html of [
      demoHtml,
      developerDocsHtml,
      catalogHtml("1000"),
      testerHtml("1000"),
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
  });
});
