import { describe, expect, it, vi } from "vitest";
import {
  probeRpc,
  simulateReadOnly,
  withDeadline,
} from "../src/lib/rpc.js";

describe("RPC reliability", () => {
  it("returns a completed operation and rejects a missed deadline", async () => {
    await expect(withDeadline(Promise.resolve("ok"), 100)).resolves.toBe("ok");
    await expect(
      withDeadline(new Promise(() => undefined), 1),
    ).rejects.toThrow("RPC deadline exceeded");
  });

  it("fails over to the next valid RPC endpoint", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        Response.json([
          { jsonrpc: "2.0", id: 1, result: "0x4cef52" },
          { jsonrpc: "2.0", id: 2, result: "0x2a" },
        ]),
      );
    await expect(
      probeRpc(["https://one.example", "https://two.example"]),
    ).resolves.toEqual({
      chainId: 5_042_002,
      blockNumber: 42n,
      rpcUrl: "https://two.example",
    });
    fetchMock.mockRestore();
  });

  it("reports all RPC failures without exposing request data", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json([{ id: 1, error: { message: "down" } }]));
    await expect(probeRpc(["https://rpc.example"])).rejects.toThrow(
      "rpc.example: down",
    );
    fetchMock.mockRestore();
  });

  it("requires a sender and normalizes simulation success and failure", async () => {
    const address = "0x1111111111111111111111111111111111111111";
    await expect(
      simulateReadOnly({} as never, {
        to: address,
        data: "0x",
        value: 0n,
      }),
    ).resolves.toMatchObject({ status: "not_run" });

    const successClient = {
      call: vi.fn().mockResolvedValue({ data: "0x" }),
      getBytecode: vi.fn().mockResolvedValue("0x1234"),
    };
    await expect(
      simulateReadOnly(successClient as never, {
        from: address,
        to: address,
        data: "0x",
        value: 0n,
      }),
    ).resolves.toEqual({ status: "success", targetHasCode: true });

    const failedClient = {
      call: vi.fn().mockRejectedValue(new Error("secret internal detail")),
      getBytecode: vi.fn().mockResolvedValue("0x"),
    };
    await expect(
      simulateReadOnly(failedClient as never, {
        from: address,
        to: address,
        data: "0x",
        value: 0n,
      }),
    ).resolves.toEqual({
      status: "failed",
      error: "Read-only RPC simulation failed.",
    });
  });
});
