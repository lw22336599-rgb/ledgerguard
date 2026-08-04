import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const mainnetHelpers = [
  new URL("../scripts/base-mainnet-e2e.mjs", import.meta.url),
  new URL("../scripts/base-mainnet-e2e-v3.mjs", import.meta.url),
];

describe("repository mainnet safety boundary", () => {
  it.each(mainnetHelpers)("keeps %s read-only", async (file) => {
    const source = await readFile(file, "utf8");

    expect(source).not.toMatch(/privateKeyToAccount|createWalletClient/);
    expect(source).not.toMatch(/\.sendTransaction\s*\(|\.writeContract\s*\(/);
    expect(source).not.toMatch(/LG_SOURCE_PK|PRIVATE_KEY/);
  });

  it("records the historical temporary address as permanently unsafe", async () => {
    const evidence = await readFile(
      new URL("../artifacts/verification/base-mainnet-e2e-v3-2026-08-04.json", import.meta.url),
      "utf8",
    );

    expect(evidence).toContain("publicly reconstructible and permanently unsafe");
    expect(evidence).toContain("not x402 settlement");
  });
});
