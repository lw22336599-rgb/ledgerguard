import { afterEach, describe, expect, it } from "vitest";
import { getPublicBaseUrl } from "../src/config/public.js";

const original = process.env.PUBLIC_BASE_URL;

afterEach(() => {
  if (original === undefined) delete process.env.PUBLIC_BASE_URL;
  else process.env.PUBLIC_BASE_URL = original;
});

describe("public origin", () => {
  it("uses the production origin by default", () => {
    delete process.env.PUBLIC_BASE_URL;
    expect(getPublicBaseUrl()).toBe("https://ledgerguard-gules.vercel.app");
  });

  it("allows a local HTTP origin for development", () => {
    process.env.PUBLIC_BASE_URL = "http://localhost:3000/";
    expect(getPublicBaseUrl()).toBe("http://localhost:3000");
  });

  it("rejects paths, credentials, and insecure remote origins", () => {
    for (const value of [
      "https://example.com/path",
      "https://user:pass@example.com",
      "http://example.com",
    ]) {
      process.env.PUBLIC_BASE_URL = value;
      expect(() => getPublicBaseUrl()).toThrow();
    }
  });
});
