import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  evidenceSchema,
  preflightSchema,
  type EvidenceInput,
  type PreflightInput,
} from "../schemas.js";

export type LedgerGuardMcpHandlers = {
  preflight: (input: PreflightInput) => Promise<Record<string, unknown>>;
  shadow: (input: PreflightInput) => Promise<Record<string, unknown>>;
  evidence: (input: EvidenceInput) => Promise<Record<string, unknown>>;
};

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

function toolResult(value: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value,
  };
}

export function createLedgerGuardMcpServer(
  handlers: LedgerGuardMcpHandlers,
): McpServer {
  const server = new McpServer({
    name: "ledgerguard-agent-firewall",
    version: "0.1.0",
  });

  server.registerTool(
    "ledgerguard_evidence",
    {
      title: "Verify LedgerGuard transaction evidence",
      description:
        "Read a confirmed Arc transaction and compare its complete observable asset effects with a declared intent. Never signs or submits.",
      inputSchema: evidenceSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) => toolResult(await handlers.evidence(input)),
  );

  server.registerTool(
    "ledgerguard_preflight",
    {
      title: "Run LedgerGuard deterministic preflight",
      description:
        "Decode, simulate, and evaluate an unsigned Arc transaction. The deterministic result cannot sign or submit a transaction.",
      inputSchema: preflightSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) => toolResult(await handlers.preflight(input)),
  );

  server.registerTool(
    "ledgerguard_shadow",
    {
      title: "Observe a LedgerGuard policy decision",
      description:
        "Return the decision LedgerGuard would make without enforcing it. Shadow mode never authorizes, signs, or submits.",
      inputSchema: preflightSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) => toolResult(await handlers.shadow(input)),
  );

  return server;
}
