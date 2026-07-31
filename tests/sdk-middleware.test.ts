import { describe, expect, it, vi } from "vitest";
import {
  LedgerGuardClient,
  LedgerGuardHttpError,
} from "../src/sdk/client.js";
import { withPreflight } from "../src/sdk/middleware.js";

describe("withPreflight middleware", () => {
  it("blocks execution when preflight returns BLOCK", async () => {
    const client = {
      canSign: vi.fn().mockResolvedValue({
        decision: "BLOCK",
        findings: [{ code: "RECIPIENT_MISMATCH", message: "Mismatch" }],
      }),
    } as unknown as LedgerGuardClient;

    await expect(
      withPreflight(
        {
          client,
          useCanSign: true,
          buildInput: () => ({
            to: "0x3600000000000000000000000000000000000000",
            recipient: "0x2222222222222222222222222222222222222222",
            amountMicroUsdc: "1000000",
            purpose: "Blocked transfer",
          }),
        },
        async () => "should-not-run",
      ),
    ).rejects.toBeInstanceOf(LedgerGuardHttpError);
  });

  it("runs the guarded action when preflight returns ALLOW", async () => {
    const client = {
      canSign: vi.fn().mockResolvedValue({ decision: "ALLOW", findings: [] }),
    } as unknown as LedgerGuardClient;
    const run = vi.fn().mockResolvedValue("signed");

    const result = await withPreflight(
      {
        client,
        useCanSign: true,
        buildInput: () => ({
          to: "0x3600000000000000000000000000000000000000",
          recipient: "0x2222222222222222222222222222222222222222",
          amountMicroUsdc: "1000000",
          purpose: "Allowed transfer",
        }),
      },
      run,
    );

    expect(result.value).toBe("signed");
    expect(run).toHaveBeenCalledOnce();
  });
});
