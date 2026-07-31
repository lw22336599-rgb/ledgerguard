import { describe, expect, it, vi } from "vitest";
import {
  LedgerGuardClient,
  LedgerGuardHttpError,
} from "../src/sdk/client.js";

const request = {
  network: "arcTestnet" as const,
  to: "0x3600000000000000000000000000000000000000" as const,
  data: "0x" as const,
  valueWei: "0",
  intent: {
    action: "contract_call" as const,
    purpose: "SDK contract",
  },
  policy: {
    allowUnlimitedApproval: false,
    requireSimulation: false,
  },
};

describe("LedgerGuard SDK", () => {
  it("calls authenticated preflight and shadow endpoints with stable client headers", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ decision: "REVIEW", findings: [], usage: { used: 1 } }),
      )
      .mockResolvedValueOnce(
        Response.json({
          enforced: false,
          wouldDecision: "REVIEW",
          findings: [],
          usage: { used: 2 },
        }),
      );
    const client = new LedgerGuardClient({
      baseUrl: "https://example.test/",
      apiKey: "lg_test_example",
      fetcher,
    });

    await expect(client.preflight(request)).resolves.toMatchObject({
      decision: "REVIEW",
    });
    await expect(client.shadow(request)).resolves.toMatchObject({
      enforced: false,
      wouldDecision: "REVIEW",
    });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://example.test/v1/developer/preflight",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer lg_test_example",
          "x-ledgerguard-client": "ledgerguard-ts/0.1.0",
        }),
      }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "https://example.test/v1/developer/shadow",
      expect.any(Object),
    );
  });

  it("calls can-sign with integration attribution header", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ decision: "ALLOW", canSign: true, findings: [] }),
    );
    const client = new LedgerGuardClient({
      baseUrl: "https://example.test",
      integration: "sdk-test-integration",
      fetcher,
    });

    await expect(
      client.canSign({
        to: "0x3600000000000000000000000000000000000000",
        recipient: "0x2222222222222222222222222222222222222222",
        amountMicroUsdc: "1000000",
        purpose: "SDK can-sign",
        requireSimulation: false,
      }),
    ).resolves.toMatchObject({ decision: "ALLOW" });

    expect(fetcher).toHaveBeenCalledWith(
      "https://example.test/v1/can-sign",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-ledgerguard-integration": "sdk-test-integration",
        }),
      }),
    );
  });

  it("returns structured HTTP errors without leaking credentials", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        { error: "QUOTA_EXCEEDED", message: "Monthly quota exhausted." },
        { status: 429 },
      ),
    );
    const client = new LedgerGuardClient({
      baseUrl: "https://example.test",
      apiKey: "lg_test_secret_value",
      fetcher,
    });

    const error = await client.preflight(request).catch((value) => value);
    expect(error).toBeInstanceOf(LedgerGuardHttpError);
    expect(error).toMatchObject({
      status: 429,
      code: "QUOTA_EXCEEDED",
    });
    expect(JSON.stringify(error)).not.toContain("lg_test_secret_value");
  });
});
