export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "LedgerGuard Preflight & Evidence API",
    version: "0.1.0",
    description:
      "Non-custodial Arc transaction preflight and post-settlement evidence.",
  },
  tags: [
    {
      name: "Operations",
      description:
        "Responses expose X-LedgerGuard-Request-Id for sanitized operational correlation.",
    },
  ],
  externalDocs: {
    description: "Human-readable integration guide",
    url: "https://ledgerguard-gules.vercel.app/docs",
  },
  servers: [
    { url: "https://ledgerguard-gules.vercel.app" },
    { url: "/" },
  ],
  paths: {
    "/.well-known/ledgerguard.json": {
      get: {
        summary: "Machine-readable service and paid-resource catalog",
        responses: { "200": { description: "LedgerGuard service catalog" } },
      },
    },
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
              example: {
                network: "arcTestnet",
                from: "0x1111111111111111111111111111111111111111",
                to: "0x3600000000000000000000000000000000000000",
                data:
                  "0xa9059cbb000000000000000000000000222222222222222222222222222222222222222200000000000000000000000000000000000000000000000000000000000f4240",
                valueWei: "0",
                intent: {
                  action: "transfer",
                  expectedDebitAddress:
                    "0x1111111111111111111111111111111111111111",
                  expectedRecipient:
                    "0x2222222222222222222222222222222222222222",
                  expectedAssetAddress:
                    "0x3600000000000000000000000000000000000000",
                  expectedAmountMicroUsdc: "1000000",
                  purpose: "Invoice 42",
                },
                policy: {
                  maxAmountMicroUsdc: "2000000",
                  requireSimulation: true,
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "ALLOW, REVIEW, or BLOCK decision",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PreflightResponse" },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "429": { description: "Rate limit exceeded" },
          "503": { description: "Requested network or RPC is unavailable" },
        },
      },
    },
    "/v1/evidence": {
      post: {
        summary: "Reconcile a finalized transaction with its declared intent",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EvidenceRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Normalized evidence bundle",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EvidenceResponse" },
              },
            },
          },
          "400": { description: "Invalid request" },
          "404": { description: "Transaction not found" },
          "429": { description: "Rate limit exceeded" },
          "503": { description: "Requested network or RPC is unavailable" },
        },
      },
    },
    "/v1/paid/network-risk": {
      get: {
        summary: "Purchase an Arc network-risk snapshot with x402",
        description:
          "Returns HTTP 402 with Circle Gateway Arc Testnet requirements until a valid payment signature is settled.",
        parameters: [
          {
            in: "header",
            name: "X-LedgerGuard-Client",
            required: false,
            schema: { type: "string", maxLength: 80 },
            description:
              "Optional non-secret integration name used in sanitized operational events.",
          },
          {
            in: "header",
            name: "PAYMENT-SIGNATURE",
            required: false,
            schema: { type: "string" },
            description: "Base64-encoded x402 v2 payment payload.",
          },
        ],
        responses: {
          "200": {
            description:
              "Payment settled; resource and Arc Testnet chain receipt returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["paid", "receipt", "networkRisk"],
                  properties: {
                    paid: { type: "boolean", const: true },
                    receipt: {
                      type: "object",
                      required: [
                        "payer",
                        "settlementTransaction",
                        "amountMicroUsdc",
                        "network",
                        "explorerUrl",
                      ],
                      properties: {
                        payer: { type: "string" },
                        settlementTransaction: { type: "string" },
                        amountMicroUsdc: { type: "string" },
                        network: { type: "string", const: "arcTestnet" },
                        explorerUrl: { type: "string", format: "uri" },
                      },
                    },
                    networkRisk: { type: "object" },
                  },
                },
              },
            },
          },
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
            $ref: "#/components/schemas/Intent",
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
      EvidenceRequest: {
        type: "object",
        required: ["txHash", "intent"],
        properties: {
          network: {
            type: "string",
            enum: ["arcTestnet", "arcMainnet"],
            default: "arcTestnet",
          },
          txHash: { type: "string", pattern: "^0x[0-9a-fA-F]{64}$" },
          intent: { $ref: "#/components/schemas/Intent" },
        },
      },
      Intent: {
        type: "object",
        required: ["action", "purpose"],
        description:
          "Transfer and approve intents also require expectedRecipient, expectedAssetAddress, and expectedAmountMicroUsdc. Declare expectedDebitAddress for payer/owner-bound evidence; transferFrom is blocked without it.",
        properties: {
          action: {
            type: "string",
            enum: ["transfer", "approve", "contract_call"],
          },
          expectedDebitAddress: {
            type: "string",
            pattern: "^0x[0-9a-fA-F]{40}$",
          },
          expectedRecipient: {
            type: "string",
            pattern: "^0x[0-9a-fA-F]{40}$",
          },
          expectedAssetAddress: {
            type: "string",
            pattern: "^0x[0-9a-fA-F]{40}$",
          },
          expectedAmountMicroUsdc: {
            type: "string",
            pattern: "^(0|[1-9][0-9]*)$",
          },
          purpose: { type: "string", minLength: 1, maxLength: 280 },
        },
      },
      Finding: {
        type: "object",
        required: ["code", "severity", "message"],
        properties: {
          code: { type: "string" },
          severity: {
            type: "string",
            enum: ["info", "warning", "critical"],
          },
          message: { type: "string" },
        },
      },
      Simulation: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["success", "failed", "not_run"],
          },
          error: { type: "string" },
          targetHasCode: {
            type: "boolean",
            description:
              "Whether the outer transaction target had deployed bytecode during simulation.",
          },
        },
      },
      DecodedAction: {
        type: "object",
        required: ["kind", "target"],
        properties: {
          kind: {
            type: "string",
            enum: [
              "native_usdc_transfer",
              "erc20_transfer",
              "erc20_approve",
              "erc20_transfer_from",
              "operator_approval",
              "contract_call",
            ],
          },
          target: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          debitAddress: { type: "string" },
          recipient: { type: "string" },
          assetAddress: { type: "string" },
          amountMicroUsdc: { type: "string" },
          approvalAmount: { type: "string" },
          method: { type: "string" },
        },
      },
      PreflightResponse: {
        type: "object",
        required: ["decision", "network", "decoded", "simulation", "findings"],
        properties: {
          decision: {
            type: "string",
            enum: ["ALLOW", "REVIEW", "BLOCK"],
          },
          network: { type: "string" },
          decoded: { $ref: "#/components/schemas/DecodedAction" },
          simulation: { $ref: "#/components/schemas/Simulation" },
          findings: {
            type: "array",
            items: { $ref: "#/components/schemas/Finding" },
          },
        },
      },
      EvidenceResponse: {
        type: "object",
        required: [
          "status",
          "network",
          "txHash",
          "blockNumber",
          "transfers",
          "approvals",
          "findings",
          "evidenceHash",
        ],
        properties: {
          status: {
            type: "string",
            enum: ["VERIFIED", "MISMATCH", "REVERTED", "REVIEW"],
          },
          network: { type: "string" },
          txHash: { type: "string" },
          blockNumber: { type: "string" },
          transactionTo: {
            oneOf: [{ type: "string" }, { type: "null" }],
          },
          nativeValueMicroUsdc: {
            oneOf: [{ type: "string" }, { type: "null" }],
          },
          transfers: { type: "array", items: { type: "object" } },
          approvals: { type: "array", items: { type: "object" } },
          findings: {
            type: "array",
            items: { $ref: "#/components/schemas/Finding" },
          },
          evidenceHash: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          issues: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
} as const;
