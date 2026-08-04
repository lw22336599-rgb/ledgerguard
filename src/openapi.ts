export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "LedgerGuard Preflight & Evidence API",
    version: "0.1.0",
    description:
      "Protocol-neutral, non-custodial transaction intent control and post-settlement evidence. Network and payment rails are isolated adapters; LedgerGuard never signs or holds keys.",
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
    "/v1/adapters": {
      get: {
        summary: "Truthful payment-protocol adapter registry",
        description:
          "Publishes implemented and interface-only adapters. No adapter signs or holds keys.",
        responses: {
          "200": { description: "Protocol adapter status and safety boundary" },
        },
      },
    },
    "/v1/shadow/arc-mainnet": {
      get: {
        summary: "Read-only Arc chain 5042 consensus and contract monitor",
        description:
          "Observes multiple independent RPC endpoints. This endpoint cannot sign, transfer funds, or enable mainnet x402 charging.",
        responses: {
          "200": {
            description:
              "RPC quorum agrees on chain ID, block height, and critical contract bytecode",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShadowStatus" },
              },
            },
          },
          "503": {
            description:
              "Shadow is disabled, incomplete, circuit-broken, or lacks consensus",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShadowStatus" },
              },
            },
          },
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
    "/v1/can-sign": {
      post: {
        summary: "Wallet-oriented preflight alias with canSign boolean",
        description:
          "Maps recipient, amount, and purpose into a transfer intent before running the standard preflight engine.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CanSignRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Preflight decision plus canSign=true only for ALLOW",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CanSignResponse" },
              },
            },
          },
          "400": { description: "Invalid request" },
          "503": { description: "Network disabled or RPC unavailable" },
        },
      },
    },
    "/v1/network-adapters": {
      get: {
        summary: "Enabled network adapters for preflight and evidence",
        responses: {
          "200": {
            description: "Adapter metadata without exposing raw RPC URLs",
          },
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
    "/v1/developer/register": {
      post: {
        summary: "Create an Arc Testnet developer tenant and API key",
        description:
          "The plaintext test key is returned once. Only its SHA-256 digest is stored.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 80 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Tenant and one-time API key created" },
          "400": { description: "Invalid registration request" },
          "429": {
            description: "Per-client daily registration limit or cohort capacity reached",
          },
          "503": {
            description: "Self-service or shared durable storage unavailable",
          },
        },
      },
    },
    "/v1/developer/account": {
      get: {
        summary: "Read the authenticated tenant and durable usage summary",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description:
              "Tenant lifecycle, enforceable plan entitlements, usage, and redacted integration proof",
          },
          "401": { description: "Missing, invalid, or revoked API key" },
          "503": { description: "Shared durable storage unavailable" },
        },
      },
    },
    "/v1/extensions": {
      get: {
        summary: "Versioned, lifecycle-aware extension registry",
        description:
          "Lists external extension manifests and their active, expired, or revoked state. Inclusion is not an endorsement.",
        responses: { "200": { description: "Extension registry snapshot" } },
      },
    },
    "/v1/extensions/health": {
      get: {
        summary: "Extension registry integrity and lifecycle health",
        responses: {
          "200": { description: "Registry parses and reports lifecycle counts" },
          "503": { description: "Registry is invalid and production readiness fails closed" },
        },
      },
    },
    "/schemas/extension-manifest-v1.json": {
      get: {
        summary: "LedgerGuard Extension Manifest v1 JSON Schema",
        responses: { "200": { description: "JSON Schema document" } },
      },
    },
    "/schemas/control-intent-v2.json": {
      get: {
        summary: "LedgerGuard protocol-neutral Control Intent v2 JSON Schema",
        responses: { "200": { description: "JSON Schema document" } },
      },
    },
    "/v1/plans": {
      get: {
        summary: "Read plan entitlements and commercial availability",
        description:
          "Machine-readable source of truth for Sandbox enforcement and paid-plan validation targets.",
        responses: {
          "200": { description: "Plan catalog and billing activation boundary" },
        },
      },
    },
    "/v1/developer/integration-proof": {
      get: {
        summary: "Read a redacted, non-attested integration activity proof",
        description:
          "Counts eligible metered events and repeat activity without exposing raw integration identifiers. It never claims an external integration has been independently verified.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Redacted activity proof and verification boundary" },
          "401": { description: "Missing, invalid, revoked, suspended, or expired API key" },
          "503": { description: "Shared durable storage unavailable" },
        },
      },
    },
    "/v1/developer/keys/rotate": {
      post: {
        summary: "Rotate the authenticated tenant API key",
        description:
          "Revokes the current key and returns its replacement once.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Previous key revoked; replacement returned" },
          "401": { description: "Missing, invalid, or revoked API key" },
          "503": { description: "Shared durable storage unavailable" },
        },
      },
    },
    "/v1/developer/webhook": {
      put: {
        summary: "Register or clear an HTTPS preflight webhook URL",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: {
                    type: "string",
                    format: "uri",
                    nullable: true,
                    description: "HTTPS endpoint or null to disable",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated tenant webhook configuration" },
          "400": { description: "Invalid webhook URL" },
          "401": { description: "Missing, invalid, or revoked API key" },
          "503": { description: "Shared durable storage unavailable" },
        },
      },
    },
    "/v1/developer/preflight": {
      post: {
        summary: "Run a quota-enforced, durably metered preflight",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PreflightRequest" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "ALLOW, REVIEW, or BLOCK decision plus durable usage summary",
          },
          "400": { description: "Invalid request" },
          "401": { description: "Missing, invalid, or revoked API key" },
          "429": { description: "Monthly tenant quota exhausted" },
          "503": { description: "Network, RPC, or durable store unavailable" },
        },
      },
    },
    "/v1/developer/shadow": {
      post: {
        summary: "Run a quota-enforced, non-enforcing shadow evaluation",
        description:
          "Returns the decision the deterministic engine would make, but never authorizes, signs, or submits a transaction.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PreflightRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Shadow decision plus durable usage summary" },
          "400": { description: "Invalid request" },
          "401": { description: "Missing, invalid, or revoked API key" },
          "429": { description: "Monthly tenant quota exhausted" },
          "503": { description: "Network, RPC, or durable store unavailable" },
        },
      },
    },
    "/v1/commercial-candidate": {
      get: {
        summary: "Inspect fail-closed production-candidate activation gates",
        responses: {
          "200": {
            description:
              "Public Base mainnet candidate metadata without credentials or secrets",
          },
        },
      },
    },
    "/v1/bazaar-candidate": {
      get: {
        summary: "Inspect the Base Sepolia x402 Bazaar discovery candidate",
        description:
          "Reports fail-closed configuration, settlement, and indexing evidence. A ready endpoint is not claimed as indexed until a real testnet settlement and Bazaar search proof exist.",
        responses: {
          "200": {
            description:
              "Public discovery-candidate metadata without credentials or secrets",
          },
        },
      },
    },
    "/v1/paid/evidence": {
      post: {
        summary: "Purchase a strict Arc transaction evidence receipt with x402",
        description:
          "Validates transaction availability before returning a Circle Gateway Arc Testnet x402 challenge.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EvidenceRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Payment settled and strict evidence delivered" },
          "400": { description: "Invalid request" },
          "402": { description: "Payment required or rejected" },
          "404": { description: "Transaction not found; no charge attempted" },
          "503": { description: "Network or facilitator unavailable" },
        },
      },
    },
    "/v1/paid/base-sepolia/evidence": {
      post: {
        summary:
          "Purchase strict Arc Testnet evidence with Base Sepolia test USDC",
        description:
          "CDP Bazaar candidate. Fails closed until the encrypted CDP credentials, seller address, and explicit testnet enable flag are configured. Successful configuration is not evidence of Bazaar indexing.",
        parameters: [
          {
            in: "header",
            name: "X-LedgerGuard-Client",
            required: false,
            schema: { type: "string", maxLength: 80 },
          },
          {
            in: "header",
            name: "X-LedgerGuard-Integration",
            required: false,
            schema: { type: "string", maxLength: 80 },
            description:
              "Public, non-secret identifier used for sanitized integration attribution.",
          },
          {
            in: "header",
            name: "PAYMENT-SIGNATURE",
            required: false,
            schema: { type: "string" },
          },
        ],
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
            description:
              "Base Sepolia test payment settled and Arc Testnet evidence delivered",
          },
          "400": { description: "Invalid request" },
          "402": { description: "CDP x402 payment required or rejected" },
          "404": { description: "Arc Testnet transaction not found" },
          "503": {
            description:
              "Candidate disabled, activation gates incomplete, or facilitator unavailable",
          },
        },
      },
    },
    "/v1/cctp/evidence": {
      post: {
        summary:
          "Verify Base Sepolia burn, Circle attestation, Arc Testnet mint, and exact USDC delivery",
        description:
          "Fail-closed CCTP V2 reconciliation. VERIFIED requires a matching destination domain, recipient, amount, complete attestation, successful destination transaction, and exact USDC mint Transfer log.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "sourceTxHash",
                  "recipient",
                  "amountMicroUsdc",
                  "feeMicroUsdc",
                ],
                properties: {
                  sourceTxHash: {
                    type: "string",
                    pattern: "^0x[0-9a-fA-F]{64}$",
                  },
                  recipient: {
                    type: "string",
                    pattern: "^0x[0-9a-fA-F]{40}$",
                  },
                  amountMicroUsdc: {
                    type: "string",
                    pattern: "^(0|[1-9][0-9]{0,3})$",
                    description: "Maximum 1000 micro-USDC (0.001 USDC).",
                  },
                  feeMicroUsdc: {
                    type: "string",
                    enum: ["0", "1"],
                    description:
                      "Configured App Kit custom bridge fee. One micro-USDC maximum.",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "All burn, attestation, mint, and exact delivery evidence verified",
          },
          "202": {
            description:
              "Evidence is pending or mismatched; no confirmed delivery or billing claim",
          },
          "400": { description: "Invalid or out-of-limit request" },
          "503": { description: "Circle or destination RPC unavailable" },
        },
      },
    },
    "/v1/guard-links": {
      post: {
        summary: "Create a time-bound, human-readable Arc Testnet Guard Link",
        description:
          "Validates a declared payment intent and returns a shareable URL. No wallet credential, signature, or private key is accepted or stored.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GuardLinkRequest" },
              example: {
                issuer: "Example Agent",
                recipient: "0x2222222222222222222222222222222222222222",
                amount: "1.00",
                limit: "1.00",
                purpose: "Example invoice",
                expires: "2030-01-01T00:00:00.000Z",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Validated Guard Link and deterministic intent ID",
          },
          "400": { description: "Invalid or unsafe payment intent" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/v1/paid/base/evidence": {
      post: {
        summary:
          "Purchase strict Arc evidence with USDC on Base Mainnet",
        description:
          "Production x402 canary using the CDP facilitator and Base Mainnet USDC. The deployed route fails closed until the explicit enable flag, action-time release phrase, CDP credentials, valid seller address, bounded price, and reviewed configuration fingerprint all match.",
        parameters: [
          {
            in: "header",
            name: "X-LedgerGuard-Client",
            required: false,
            schema: { type: "string", maxLength: 80 },
          },
          {
            in: "header",
            name: "X-LedgerGuard-Integration",
            required: false,
            schema: { type: "string", maxLength: 80 },
          },
          {
            in: "header",
            name: "PAYMENT-SIGNATURE",
            required: false,
            schema: { type: "string" },
          },
        ],
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
            description:
              "When the disabled-by-default canary is explicitly enabled, Base Mainnet payment settled and strict Arc evidence delivered",
          },
          "400": { description: "Invalid request; no charge attempted" },
          "402": { description: "CDP x402 payment required or rejected" },
          "404": {
            description: "Arc transaction not found; no charge attempted",
          },
          "503": {
            description:
              "Canary disabled, activation gates incomplete, evidence unavailable, or facilitator unavailable",
          },
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
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "LedgerGuard test API key",
      },
    },
    schemas: {
      GuardLinkRequest: {
        type: "object",
        required: ["recipient", "amount", "purpose", "expires"],
        properties: {
          issuer: {
            type: "string",
            minLength: 2,
            maxLength: 80,
            description: "Optional self-declared requester name; not verified identity.",
          },
          payer: {
            type: "string",
            pattern: "^0x[0-9a-fA-F]{40}$",
            description: "Optional public payer address.",
          },
          recipient: {
            type: "string",
            pattern: "^0x[0-9a-fA-F]{40}$",
          },
          amount: {
            type: "string",
            pattern: "^(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,6})?$",
          },
          limit: {
            type: "string",
            pattern: "^(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,6})?$",
          },
          purpose: { type: "string", minLength: 1, maxLength: 120 },
          expires: { type: "string", format: "date-time" },
        },
      },
      PreflightRequest: {
        type: "object",
        required: ["to", "intent", "policy"],
        properties: {
          network: {
            type: "string",
            enum: ["arcTestnet", "arcMainnet", "baseMainnet"],
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
            enum: ["arcTestnet", "arcMainnet", "baseMainnet"],
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
      CanSignRequest: {
        type: "object",
        required: ["to", "recipient", "amountMicroUsdc", "purpose"],
        properties: {
          network: {
            type: "string",
            enum: ["arcTestnet", "arcMainnet", "baseMainnet"],
            default: "arcTestnet",
          },
          from: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          to: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          data: { type: "string", pattern: "^0x[0-9a-fA-F]*$", default: "0x" },
          valueWei: { type: "string", pattern: "^(0|[1-9][0-9]*)$", default: "0" },
          recipient: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          amountMicroUsdc: { type: "string", pattern: "^(0|[1-9][0-9]*)$" },
          purpose: { type: "string", minLength: 1, maxLength: 280 },
          assetAddress: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          payer: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          maxAmountMicroUsdc: { type: "string" },
          requireSimulation: { type: "boolean", default: true },
        },
      },
      CanSignResponse: {
        allOf: [
          { $ref: "#/components/schemas/PreflightResponse" },
          {
            type: "object",
            required: ["canSign"],
            properties: {
              canSign: { type: "boolean" },
            },
          },
        ],
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
      ShadowStatus: {
        type: "object",
        required: [
          "ok",
          "enabled",
          "ready",
          "mode",
          "releaseStage",
          "realFundsEnabled",
          "signingEnabled",
          "x402MainnetEnabled",
          "chainId",
          "requiredHealthyRpcs",
          "healthyRpcs",
          "requiredHealthyObservers",
          "healthyObservers",
          "contractsConsistent",
          "rpcHosts",
          "observerHosts",
          "failures",
          "checkedAt",
        ],
        properties: {
          ok: { type: "boolean" },
          enabled: { type: "boolean" },
          ready: { type: "boolean" },
          mode: { type: "string", const: "read-only-shadow" },
          releaseStage: { type: "string", const: "pre-ga-observed" },
          realFundsEnabled: { type: "boolean", const: false },
          signingEnabled: { type: "boolean", const: false },
          x402MainnetEnabled: { type: "boolean", const: false },
          chainId: { type: "integer", const: 5042 },
          configFingerprint: {
            oneOf: [{ type: "string" }, { type: "null" }],
          },
          requiredHealthyRpcs: { type: "integer", minimum: 1 },
          healthyRpcs: { type: "integer", minimum: 0 },
          requiredHealthyObservers: { type: "integer", minimum: 1 },
          healthyObservers: { type: "integer", minimum: 0 },
          headBlock: {
            oneOf: [{ type: "string" }, { type: "null" }],
          },
          blockLag: {
            oneOf: [{ type: "string" }, { type: "null" }],
          },
          maximumBlockLag: { type: "integer", minimum: 1 },
          contractsConsistent: { type: "boolean" },
          rpcHosts: {
            type: "array",
            items: {
              type: "object",
              required: [
                "host",
                "healthy",
                "chainId",
                "blockNumber",
                "criticalContractsPresent",
              ],
              properties: {
                host: { type: "string" },
                healthy: { type: "boolean" },
                chainId: {
                  oneOf: [{ type: "integer" }, { type: "null" }],
                },
                blockNumber: {
                  oneOf: [{ type: "string" }, { type: "null" }],
                },
                criticalContractsPresent: { type: "boolean" },
              },
            },
          },
          observerHosts: {
            type: "array",
            items: {
              type: "object",
              required: ["host", "healthy", "chainId", "blockNumber"],
              properties: {
                host: { type: "string" },
                healthy: { type: "boolean" },
                chainId: {
                  oneOf: [{ type: "integer" }, { type: "null" }],
                },
                blockNumber: {
                  oneOf: [{ type: "string" }, { type: "null" }],
                },
              },
            },
          },
          failures: { type: "array", items: { type: "string" } },
          checkedAt: { type: "string", format: "date-time" },
          cached: { type: "boolean" },
          circuitOpen: { type: "boolean" },
        },
      },
    },
  },
} as const;
