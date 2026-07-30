import { describe, expect, it, vi } from "vitest";
import {
  probeRpc,
  probeRpcConsensus,
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

  it("requires multi-RPC agreement for the 5042 shadow", async () => {
    const code = "0x6001600055";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input) => {
        const host = new URL(String(input)).host;
        const block = host === "one.example" ? "0x64" : "0x66";
        return Response.json([
          { jsonrpc: "2.0", id: 1, result: "0x13b2" },
          { jsonrpc: "2.0", id: 2, result: block },
          { jsonrpc: "2.0", id: 3, result: code },
          { jsonrpc: "2.0", id: 4, result: code },
        ]);
      },
    );

    const result = await probeRpcConsensus({
      rpcUrls: ["https://one.example", "https://two.example"],
      expectedChainId: 5_042,
      minimumHealthyRpcs: 2,
      maximumBlockLag: 5,
      contracts: [
        {
          label: "USDC",
          address: "0x3600000000000000000000000000000000000000",
        },
        {
          label: "GatewayMinter",
          address: "0x2222222d7164433c4C09B0b0D809a9b52C04C205",
        },
      ],
    });

    expect(result).toMatchObject({
      ok: true,
      healthyRpcs: 2,
      blockLag: 2n,
      contractsConsistent: true,
      failures: [],
    });
    fetchMock.mockRestore();
  });

  it("fails closed on chain, height, or bytecode disagreement", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input) => {
        const wrong = new URL(String(input)).host === "two.example";
        return Response.json([
          {
            jsonrpc: "2.0",
            id: 1,
            result: wrong ? "0x1" : "0x13b2",
          },
          {
            jsonrpc: "2.0",
            id: 2,
            result: wrong ? "0xc8" : "0x64",
          },
          {
            jsonrpc: "2.0",
            id: 3,
            result: wrong ? "0x6002" : "0x6001",
          },
          { jsonrpc: "2.0", id: 4, result: "0x6001" },
        ]);
      },
    );

    const result = await probeRpcConsensus({
      rpcUrls: ["https://one.example", "https://two.example"],
      expectedChainId: 5_042,
      minimumHealthyRpcs: 2,
      maximumBlockLag: 5,
      contracts: [
        {
          label: "USDC",
          address: "0x3600000000000000000000000000000000000000",
        },
        {
          label: "GatewayMinter",
          address: "0x2222222d7164433c4C09B0b0D809a9b52C04C205",
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.healthyRpcs).toBe(1);
    expect(result.failures.join(" ")).toMatch(/chain ID 1/);
    expect(result.failures.join(" ")).toMatch(/Only 1\/2/);
    expect(result.failures.join(" ")).toMatch(/bytecode/);
    fetchMock.mockRestore();
  });
});
