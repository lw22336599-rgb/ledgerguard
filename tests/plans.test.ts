import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { catalogHtml } from "../src/ui.js";

import {
  getPlan,
  listPublicPlans,
  normalizePlanId,
} from "../src/config/plans.js";

describe("commercial plan catalog", () => {
  it("uses one enforceable Sandbox entitlement everywhere", () => {
    expect(getPlan("sandbox")).toMatchObject({
      id: "sandbox",
      monthlyOperations: 500,
      retentionDays: 7,
      selfService: true,
      availability: "available",
    });
  });

  it("keeps paid plans explicit but unavailable until billing is connected", () => {
    expect(getPlan("developer")).toMatchObject({
      monthlyOperations: 10_000,
      monthlyPriceUsd: 99,
      selfService: false,
      availability: "validation",
    });
    expect(listPublicPlans()).toHaveLength(5);
  });

  it("normalizes legacy testnet tenants without breaking their keys", () => {
    expect(normalizePlanId("testnet")).toBe("sandbox");
    expect(normalizePlanId("unknown")).toBe("sandbox");
  });

  it("publishes the same catalog to machines and the pricing page", async () => {
    const response = await app.request("/v1/plans");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plans[0]).toMatchObject({
      id: "sandbox",
      monthlyOperations: 500,
      retentionDays: 7,
    });
    expect(body.plans).toHaveLength(5);
    expect(catalogHtml).toContain("500 protected operations / month");
    expect(catalogHtml).toContain("$99 / month (target)");
  });
});
