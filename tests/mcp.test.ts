import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { createLedgerGuardMcpServer } from "../src/mcp/server.js";

describe("LedgerGuard MCP server", () => {
  it("exposes read-only preflight, shadow, and evidence tools", async () => {
    const preflight = vi.fn(async () => ({ decision: "REVIEW" }));
    const shadow = vi.fn(async () => ({
      enforced: false,
      wouldDecision: "REVIEW",
    }));
    const evidence = vi.fn(async () => ({
      status: "VERIFIED",
      evidenceHash: "0x" + "ab".repeat(32),
    }));
    const server = createLedgerGuardMcpServer({
      preflight,
      shadow,
      evidence,
    });
    const client = new Client({ name: "ledgerguard-test", version: "0.1.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual([
      "ledgerguard_evidence",
      "ledgerguard_preflight",
      "ledgerguard_shadow",
    ]);
    expect(
      listed.tools.every(
        (tool) => tool.annotations?.readOnlyHint === true,
      ),
    ).toBe(true);

    const result = await client.callTool({
      name: "ledgerguard_shadow",
      arguments: {
        network: "arcTestnet",
        to: "0x3600000000000000000000000000000000000000",
        data: "0x",
        valueWei: "0",
        intent: {
          action: "contract_call",
          purpose: "MCP test",
        },
        policy: {
          requireSimulation: false,
        },
      },
    });
    expect(shadow).toHaveBeenCalledOnce();
    expect(result.structuredContent).toMatchObject({
      enforced: false,
      wouldDecision: "REVIEW",
    });

    await Promise.all([client.close(), server.close()]);
  });
});
