import { describe, expect, it } from "vitest";
import { strictEvidenceDiscoveryExtension } from "../src/services/discovery.js";

describe("x402 Bazaar discovery metadata", () => {
  it("declares a POST JSON body and strict evidence output", () => {
    const extension = strictEvidenceDiscoveryExtension();
    expect(extension).toHaveProperty("bazaar");
    expect(extension.bazaar).toMatchObject({
      info: {
        input: {
          type: "http",
          bodyType: "json",
        },
        output: {
          example: {
            deliverable: "strict-evidence-receipt",
          },
        },
      },
    });
  });
});
