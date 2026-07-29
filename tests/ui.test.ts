import { describe, expect, it } from "vitest";
import { demoJs } from "../src/ui.js";

describe("browser demo result freshness", () => {
  it("invalidates the displayed result when inputs change", () => {
    expect(demoJs).toContain('form.addEventListener("input"');
    expect(demoJs).toContain("Inputs changed. Run preflight again.");
  });

  it("clears stale output when native form validation blocks submission", () => {
    expect(demoJs).toContain('form.addEventListener("invalid"');
    expect(demoJs).toContain("Fix the invalid input, then run preflight again.");
  });
});
