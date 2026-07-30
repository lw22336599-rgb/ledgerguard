import { beforeEach, describe, expect, it, vi } from "vitest";

const x402 = vi.hoisted(() => {
  class InvalidPaymentSignatureError extends Error {}
  return {
    InvalidPaymentSignatureError,
    settlePayment: vi.fn(),
  };
});

vi.mock("../src/services/x402.js", () => ({
  encodePaymentRequired: vi.fn(() => "encoded-challenge"),
  getConfiguredX402PriceMicroUsdc: vi.fn(() => "1000"),
  getConfiguredSellerAddress: vi.fn(
    () => "0xF1437D9cD304ae49F2Ec005AC967813b3a7C466C",
  ),
  getArcPaymentRequirements: vi.fn(async () => ({
    scheme: "exact",
    network: "eip155:5042002",
    asset: "0x3600000000000000000000000000000000000000",
    amount: "1000",
    payTo: "0xf1437d9cd304ae49f2ec005ac967813b3a7c466c",
    maxTimeoutSeconds: 604_900,
  })),
  InvalidPaymentSignatureError: x402.InvalidPaymentSignatureError,
  settlePayment: x402.settlePayment,
  x402Enabled: vi.fn(() => true),
}));

const { app } = await import("../src/app.js");
const { resetTenantStoreForTests } = await import(
  "../src/services/tenant-store.js"
);

describe("paid HTTP delivery", () => {
  beforeEach(() => {
    x402.settlePayment.mockReset();
    delete process.env.OPERATIONS_WEBHOOK_URL;
    process.env.LEDGERGUARD_STORAGE_BACKEND = "memory";
    resetTenantStoreForTests();
  });

  it("returns a payment challenge before settlement", async () => {
    const response = await app.request("/v1/paid/network-risk");
    expect(response.status).toBe(402);
    expect(response.headers.get("payment-required")).toBe("encoded-challenge");
    expect(await response.json()).toMatchObject({
      error: "PAYMENT_REQUIRED",
      priceMicroUsdc: "1000",
    });
  });

  it("returns the resource and public chain receipt after settlement", async () => {
    x402.settlePayment.mockResolvedValue({
      success: true,
      payer: "0x1111111111111111111111111111111111111111",
      transaction: "0x" + "ab".repeat(32),
      network: "eip155:5042002",
    });
    const response = await app.request("/v1/paid/network-risk", {
      headers: { "payment-signature": "valid" },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("payment-response")).toBeTruthy();
    expect(await response.json()).toMatchObject({
      paid: true,
      ledgerStatus: "recorded",
      receipt: {
        amountMicroUsdc: "1000",
        network: "arcTestnet",
      },
    });
  });

  it("fails closed for rejected, malformed, and unavailable settlement", async () => {
    x402.settlePayment.mockResolvedValueOnce({
      success: false,
      transaction: "",
      network: "eip155:5042002",
    });
    expect(
      (
        await app.request("/v1/paid/network-risk", {
          headers: { "payment-signature": "rejected" },
        })
      ).status,
    ).toBe(402);

    x402.settlePayment.mockRejectedValueOnce(
      new x402.InvalidPaymentSignatureError(),
    );
    expect(
      (
        await app.request("/v1/paid/network-risk", {
          headers: { "payment-signature": "malformed" },
        })
      ).status,
    ).toBe(402);

    x402.settlePayment.mockRejectedValueOnce(new Error("facilitator offline"));
    expect(
      (
        await app.request("/v1/paid/network-risk", {
          headers: { "payment-signature": "unavailable" },
        })
      ).status,
    ).toBe(503);
  });
});
