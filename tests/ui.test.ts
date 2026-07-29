import { describe, expect, it } from "vitest";
import {
  catalogHtml,
  demoHtml,
  demoJs,
  developerDocsHtml,
} from "../src/ui.js";

describe("browser demo experience", () => {
  it("invalidates the displayed result when inputs change", () => {
    expect(demoJs).toContain('form.addEventListener("input"');
    expect(demoJs).toContain("输入已改变，请重新运行检查。");
  });

  it("clears stale output when native form validation blocks submission", () => {
    expect(demoJs).toContain('form.addEventListener("invalid"');
    expect(demoJs).toContain("请先修正无效输入");
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
    expect(demoJs).toContain("发现明确风险，不应签名或发送。");
    expect(demoJs).toContain("JSON.stringify(body,null,2)");
    expect(demoHtml).toContain("result-details");
  });

  it("explains that machine JSON is intentional", () => {
    expect(developerDocsHtml).toContain("机器文件");
    expect(catalogHtml("1000")).toContain("1000 micro-USDC");
  });
});
