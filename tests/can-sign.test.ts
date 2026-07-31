import { encodeFunctionData, parseAbi } from "viem";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { ARC_TESTNET_USDC } from "../src/config/networks.js";
import { canSignToPreflight } from "../src/services/can-sign.js";

const transferAbi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);
const recipient = "0x2222222222222222222222222222222222222222";

describe("can-sign", () => {
  it("maps wallet-friendly fields into a transfer preflight input", () => {
    const data = encodeFunctionData({
      abi: transferAbi,
      functionName: "transfer",
      args: [recipient, 1_000_000n],
    });
    const mapped = canSignToPreflight({
      network: "arcTestnet",
      to: ARC_TESTNET_USDC,
      data,
      valueWei: "0",
      recipient,
      amountMicroUsdc: "1000000",
      purpose: "Invoice 42",
      requireSimulation: false,
    });
    expect(mapped.intent).toMatchObject({
      action: "transfer",
      expectedRecipient: recipient,
      expectedAssetAddress: ARC_TESTNET_USDC,
      expectedAmountMicroUsdc: "1000000",
      purpose: "Invoice 42",
    });
  });

  it("exposes POST /v1/can-sign with canSign=false on REVIEW", async () => {
    const data = encodeFunctionData({
      abi: transferAbi,
      functionName: "transfer",
      args: [recipient, 1_000_000n],
    });
    const response = await app.request("/v1/can-sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        network: "arcTestnet",
        to: ARC_TESTNET_USDC,
        data,
        recipient,
        amountMicroUsdc: "1000000",
        purpose: "Can-sign API test",
        requireSimulation: false,
      }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.decision).toBe("REVIEW");
    expect(body.canSign).toBe(false);
    expect(body.findings.map((finding: { code: string }) => finding.code)).toContain(
      "SIMULATION_REQUIRED",
    );
  });

  it("rejects malformed can-sign requests", async () => {
    const response = await app.request("/v1/can-sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: recipient, purpose: "missing fields" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("INVALID_REQUEST");
  });
});
