import { beforeEach, describe, expect, it, vi } from "vitest";

const x402 = vi.hoisted(() => {
  class InvalidPaymentSignatureError extends Error {}
  return {
    InvalidPaymentSignatureError,
    settlePayment: vi.fn(),
  };
});
const evidence = vi.hoisted(() => {
  class TransactionNotFoundError extends Error {}
  return {
    TransactionNotFoundError,
    retrieveEvidence: vi.fn(),
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
vi.mock("../src/services/evidence-retrieval.js", () => ({
  TransactionNotFoundError: evidence.TransactionNotFoundError,
  retrieveEvidence: evidence.retrieveEvidence,
}));

const { app } = await import("../src/app.js");
const { resetTenantStoreForTests } = await import(
  "../src/services/tenant-store.js"
);

describe("paid HTTP delivery", () => {
  beforeEach(() => {
    x402.settlePayment.mockReset();
    evidence.retrieveEvidence.mockReset();
    evidence.retrieveEvidence.mockResolvedValue({
      status: "VERIFIED",
      network: "arcTestnet",
      txHash: `0x${"aa".repeat(32)}`,
      blockNumber: "42",
      transactionTo: "0x3600000000000000000000000000000000000000",
      nativeValueMicroUsdc: null,
      transfers: [],
      approvals: [],
      findings: [],
      evidenceHash: `0x${"bb".repeat(32)}`,
    });
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

  it("challenges and then delivers strict evidence without charging a missing transaction", async () => {
    const body = {
      network: "arcTestnet",
      txHash: `0x${"aa".repeat(32)}`,
      intent: {
        action: "transfer",
        expectedDebitAddress: "0x1111111111111111111111111111111111111111",
        expectedRecipient: "0x2222222222222222222222222222222222222222",
        expectedAssetAddress: "0x3600000000000000000000000000000000000000",
        expectedAmountMicroUsdc: "1000000",
        purpose: "Paid evidence test",
      },
    };
    const challenge = await app.request("/v1/paid/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(challenge.status).toBe(402);
    expect(await challenge.json()).toMatchObject({
      deliverable: "strict-evidence-receipt",
    });

    x402.settlePayment.mockResolvedValue({
      success: true,
      payer: "0x1111111111111111111111111111111111111111",
      transaction: `0x${"cc".repeat(32)}`,
      network: "eip155:5042002",
    });
    const delivered = await app.request("/v1/paid/evidence", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "payment-signature": "valid",
      },
      body: JSON.stringify(body),
    });
    expect(delivered.status).toBe(200);
    expect(await delivered.json()).toMatchObject({
      paid: true,
      deliverable: "strict-evidence-receipt",
      evidence: { status: "VERIFIED" },
    });

    evidence.retrieveEvidence.mockRejectedValueOnce(
      new evidence.TransactionNotFoundError("missing"),
    );
    const missing = await app.request("/v1/paid/evidence", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "payment-signature": "valid",
      },
      body: JSON.stringify(body),
    });
    expect(missing.status).toBe(404);
    expect(x402.settlePayment).toHaveBeenCalledTimes(1);
  });
});
