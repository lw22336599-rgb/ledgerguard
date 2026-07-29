import { describe, expect, it, vi } from "vitest";
import {
  notifyPaymentSettlement,
  paymentReceipt,
} from "../src/services/operations.js";

describe("operations evidence", () => {
  it("creates a durable-chain receipt link without storing wallet secrets", () => {
    expect(
      paymentReceipt({
        payer: "0x1111111111111111111111111111111111111111",
        transaction: "0x" + "ab".repeat(32),
        amountMicroUsdc: "1000",
      }),
    ).toEqual({
      payer: "0x1111111111111111111111111111111111111111",
      settlementTransaction: "0x" + "ab".repeat(32),
      amountMicroUsdc: "1000",
      network: "arcTestnet",
      explorerUrl:
        "https://testnet.arcscan.app/tx/0x" + "ab".repeat(32),
    });
  });

  it("does not fail resource delivery when an optional notification fails", async () => {
    process.env.OPERATIONS_WEBHOOK_URL = "https://notify.example.test/hook";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("offline"));
    await expect(
      notifyPaymentSettlement({
        requestId: "req-1",
        payer: "0x1111111111111111111111111111111111111111",
        transaction: "0x" + "ab".repeat(32),
        amountMicroUsdc: "1000",
      }),
    ).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
    delete process.env.OPERATIONS_WEBHOOK_URL;
  });

  it("skips missing, malformed, and insecure notification destinations", async () => {
    delete process.env.OPERATIONS_WEBHOOK_URL;
    await expect(
      notifyPaymentSettlement({
        requestId: "req-1",
        payer: "payer",
        transaction: "tx",
        amountMicroUsdc: "1000",
      }),
    ).resolves.toBe(false);

    for (const url of ["not-a-url", "http://notify.example.test/hook"]) {
      process.env.OPERATIONS_WEBHOOK_URL = url;
      await expect(
        notifyPaymentSettlement({
          requestId: "req-1",
          payer: "payer",
          transaction: "tx",
          amountMicroUsdc: "1000",
        }),
      ).resolves.toBe(false);
    }
    delete process.env.OPERATIONS_WEBHOOK_URL;
  });

  it("accepts a successful HTTPS operator notification", async () => {
    process.env.OPERATIONS_WEBHOOK_URL = "https://notify.example.test/hook";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    await expect(
      notifyPaymentSettlement({
        requestId: "req-2",
        payer: "payer",
        transaction: "tx",
        amountMicroUsdc: "1000",
      }),
    ).resolves.toBe(true);
    fetchMock.mockRestore();
    delete process.env.OPERATIONS_WEBHOOK_URL;
  });
});
