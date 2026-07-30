import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

describe("wallet core source", () => {
  it("does not use the browser prompt for wallet selection", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../src/browser/wallet-core.ts", import.meta.url)),
      "utf8",
    );
    expect(source).not.toContain("window.prompt");
    expect(source).toContain("showWalletPicker");
  });
});
