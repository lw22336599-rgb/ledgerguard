export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "LedgerGuard Preflight & Evidence API",
    version: "0.1.0",
    description:
      "Non-custodial Arc transaction preflight and post-settlement evidence.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/v1/meta": {
      get: {
        summary: "Machine-readable service metadata",
        responses: { "200": { description: "Service metadata" } },
      },
    },
    "/v1/networks": {
      get: {
        summary: "Supported network registry and release state",
        responses: { "200": { description: "Public network configuration" } },
      },
    },
    "/health": {
      get: {
        summary: "Process health",
        responses: { "200": { description: "Healthy" } },
      },
    },
    "/ready": {
      get: {
        summary: "Arc Testnet RPC readiness",
        responses: {
          "200": { description: "RPC chain ID verified" },
          "503": { description: "RPC unavailable or wrong chain" },
        },
      },
    },
    "/v1/preflight": {
      post: {
        summary: "Inspect and simulate an unsigned transaction",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PreflightRequest" },
            },
          },
        },
        responses: {
          "200": { description: "ALLOW, REVIEW, or BLOCK decision" },
          "400": { description: "Invalid request" },
          "503": { description: "Requested network is disabled" },
        },
      },
    },
    "/v1/evidence": {
      post: {
        summary: "Reconcile a finalized transaction with its declared intent",
        responses: {
          "200": { description: "Normalized evidence bundle" },
          "400": { description: "Invalid request" },
          "404": { description: "Transaction not found" },
        },
      },
    },
    "/v1/paid/network-risk": {
      get: {
        summary: "Purchase an Arc network-risk snapshot with x402",
        description:
          "Returns HTTP 402 with Circle Gateway Arc Testnet requirements until a valid payment signature is settled.",
        responses: {
          "200": { description: "Payment settled and resource returned" },
          "402": { description: "Payment required or rejected" },
          "503": { description: "x402 disabled or facilitator unavailable" },
        },
      },
    },
  },
  components: {
    schemas: {
      PreflightRequest: {
        type: "object",
        required: ["to", "intent", "policy"],
        properties: {
          network: {
            type: "string",
            enum: ["arcTestnet", "arcMainnet"],
            default: "arcTestnet",
          },
          from: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          to: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          data: { type: "string", pattern: "^0x[0-9a-fA-F]*$", default: "0x" },
          valueWei: { type: "string", pattern: "^(0|[1-9][0-9]*)$", default: "0" },
          intent: {
            type: "object",
            required: ["action", "purpose"],
            properties: {
              action: {
                type: "string",
                enum: ["transfer", "approve", "contract_call"],
              },
              expectedRecipient: { type: "string" },
              expectedAssetAddress: { type: "string" },
              expectedAmountMicroUsdc: { type: "string" },
              purpose: { type: "string", maxLength: 280 },
            },
          },
          policy: {
            type: "object",
            properties: {
              allowedTargets: { type: "array", items: { type: "string" } },
              maxAmountMicroUsdc: { type: "string" },
              allowUnlimitedApproval: { type: "boolean", default: false },
              requireSimulation: { type: "boolean", default: true },
            },
          },
        },
      },
    },
  },
} as const;
