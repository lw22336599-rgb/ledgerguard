import { Hono } from "hono";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { getAddress, type Address, type Hex } from "viem";
import { getNetworkRegistry, requireEnabledNetwork } from "./config/networks.js";
import { getPublicBaseUrl } from "./config/public.js";
import { getCommercialCandidate } from "./config/commercial.js";
import { getArcMainnetShadowConfiguration } from "./config/shadow.js";
import {
  createNetworkClient,
  probeRpc,
  simulateReadOnly,
  withDeadline,
} from "./lib/rpc.js";
import { rateLimit } from "./middleware/rate-limit.js";
import {
  type AppEnvironment,
  requestTelemetry,
} from "./middleware/request-telemetry.js";
import { openApiDocument } from "./openapi.js";
import {
  developerRegistrationSchema,
  evidenceSchema,
  preflightSchema,
  type PreflightInput,
} from "./schemas.js";
import {
  retrieveEvidence,
  TransactionNotFoundError,
} from "./services/evidence-retrieval.js";
import { strictEvidenceDiscoveryExtension } from "./services/discovery.js";
import { evaluatePreflight } from "./services/preflight.js";
import { createLedgerGuardMcpServer } from "./mcp/server.js";
import { getArcMainnetShadowStatus } from "./services/shadow.js";
import {
  notifyPaymentSettlement,
  paymentReceipt,
} from "./services/operations.js";
import {
  encodePaymentRequired,
  getConfiguredX402PriceMicroUsdc,
  getConfiguredSellerAddress,
  getArcPaymentRequirements,
  InvalidPaymentSignatureError,
  settlePayment,
  x402Enabled,
} from "./services/x402.js";
import {
  getTenantStore,
  QuotaExceededError,
  TenantCapacityError,
  selfServiceEnabled,
  type Tenant,
} from "./services/tenant-store.js";
import {
  catalogHtml,
  demoCss,
  demoHtml,
  demoJs,
  developerConsoleHtml,
  developerConsoleJs,
  developerDocsHtml,
  faviconSvg,
  integrationBoundaryHtml,
  statusHtml,
  testerHtml,
} from "./ui.js";
import { developerShadowJs } from "./ui-shadow.js";

export const app = new Hono<AppEnvironment>();

app.use("*", requestTelemetry);
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "Payment-Signature",
      "X-LedgerGuard-Client",
      "Mcp-Session-Id",
      "Mcp-Protocol-Version",
      "Last-Event-ID",
    ],
    exposeHeaders: [
      "Payment-Required",
      "Payment-Response",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
      "Retry-After",
      "X-LedgerGuard-Request-Id",
      "Mcp-Session-Id",
      "Mcp-Protocol-Version",
    ],
    maxAge: 86_400,
  }),
);
app.use("*", prettyJSON());
app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      baseUri: ["'none'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
    permissionsPolicy: {
      camera: [],
      geolocation: [],
      microphone: [],
      payment: [],
      usb: [],
    },
  }),
);
app.use("*", async (context, next) => {
  if (
    context.req.path.startsWith("/v1/") ||
    context.req.path === "/health" ||
    context.req.path === "/ready" ||
    context.req.path === "/mcp"
  ) {
    context.header("Cache-Control", "no-store");
  }
  await next();
});
app.use("/v1/*", rateLimit);
app.use("/mcp", rateLimit);
app.use("/ready", rateLimit);
app.use("/status", rateLimit);
app.use(
  "/v1/*",
  bodyLimit({
    maxSize: 64 * 1024,
    onError: (context) =>
      context.json({ error: "REQUEST_BODY_TOO_LARGE" }, 413),
  }),
);

app.get("/", (context) => context.html(demoHtml));
app.get("/docs", (context) => context.html(developerDocsHtml));
app.get("/developer", (context) =>
  context.html(
    developerConsoleHtml({
      storageReady: getTenantStore() !== null,
      registrationEnabled: selfServiceEnabled(),
    }),
  ),
);
app.use(
  "/mcp",
  bodyLimit({
    maxSize: 64 * 1024,
    onError: (context) =>
      context.json({ error: "REQUEST_BODY_TOO_LARGE" }, 413),
  }),
);
app.get("/docs/integration", (context) =>
  context.html(integrationBoundaryHtml),
);
app.get("/catalog", (context) =>
  context.html(
    catalogHtml(
      getConfiguredX402PriceMicroUsdc(),
      getConfiguredSellerAddress(),
    ),
  ),
);
app.get("/test", (context) =>
  context.html(
    testerHtml(
      getConfiguredX402PriceMicroUsdc(),
      getConfiguredSellerAddress(),
    ),
  ),
);
app.get("/status", async (context) => {
  let readiness:
    | { ready: true; chainId: number; blockNumber: string }
    | { ready: false } = { ready: false };
  try {
    const network = requireEnabledNetwork("arcTestnet");
    const probe = await probeRpc(network.rpcUrls);
    readiness =
      probe.chainId === network.chainId
        ? {
            ready: true,
            chainId: probe.chainId,
            blockNumber: probe.blockNumber.toString(),
          }
        : { ready: false };
  } catch {
    readiness = { ready: false };
  }
  const registry = getNetworkRegistry();
  const shadow = await getArcMainnetShadowStatus();
  return context.html(
    statusHtml({
      ...readiness,
      x402: x402Enabled(),
      mainnet: registry.arcMainnet.enabled,
      shadow: {
        ok: shadow.ok,
        enabled: shadow.enabled,
        chainId: shadow.chainId,
        headBlock: shadow.headBlock,
        healthyRpcs: shadow.healthyRpcs,
        healthyObservers: shadow.healthyObservers,
      },
    }),
  );
});
app.get("/styles.css", (context) =>
  context.body(demoCss, 200, { "Content-Type": "text/css; charset=utf-8" }),
);
app.get("/app.js", (context) =>
  context.body(demoJs, 200, { "Content-Type": "text/javascript; charset=utf-8" }),
);
app.get("/developer.js", (context) =>
  context.body(`${developerConsoleJs}\n${developerShadowJs}`, 200, {
    "Content-Type": "text/javascript; charset=utf-8",
  }),
);
for (const path of ["/favicon.svg", "/favicon.ico", "/favicon.png"]) {
  app.get(path, (context) =>
    context.body(faviconSvg, 200, {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    }),
  );
}
app.get("/llms.txt", (context) =>
  context.text(`LedgerGuard
Production: https://ledgerguard-gules.vercel.app
OpenAPI: https://ledgerguard-gules.vercel.app/openapi.json
Service catalog: https://ledgerguard-gules.vercel.app/.well-known/ledgerguard.json
Public testing: https://ledgerguard-gules.vercel.app/test
Free Arc transaction preflight: POST /v1/preflight
Paid Arc Testnet x402 resource: GET /v1/paid/network-risk
Safety: non-custodial; never send a seed phrase or private key.
Mainnet: disabled until official parameters pass the documented release gate.
`),
);
app.get("/.well-known/ledgerguard.json", (context) =>
  context.json({
    service: "LedgerGuard",
    production: getPublicBaseUrl(),
    humanDocs: `${getPublicBaseUrl()}/docs`,
    openapi: `${getPublicBaseUrl()}/openapi.json`,
    testing: `${getPublicBaseUrl()}/test`,
    support:
      "https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose",
    custody: "none",
    signing: "client-side-only",
    mainnet: "disabled",
    mcp: {
      endpoint: `${getPublicBaseUrl()}/mcp`,
      transport: "streamable-http",
      authentication: "bearer-api-key",
    },
    commercialCandidate: getCommercialCandidate(),
    resources: [
      {
        id: "arc-network-risk",
        method: "GET",
        path: "/v1/paid/network-risk",
        paymentProtocol: "x402-v2",
        network: "eip155:5042002",
        priceMicroUsdc: getConfiguredX402PriceMicroUsdc(),
        payTo: getConfiguredSellerAddress(),
      },
      {
        id: "arc-strict-evidence",
        method: "POST",
        path: "/v1/paid/evidence",
        paymentProtocol: "x402-v2",
        network: "eip155:5042002",
        priceMicroUsdc: getConfiguredX402PriceMicroUsdc(),
        payTo: getConfiguredSellerAddress(),
        deliverable: "strict-evidence-receipt",
      },
    ],
  }),
);
app.get("/v1/commercial-candidate", (context) =>
  context.json(getCommercialCandidate()),
);
app.get("/v1/meta", (context) =>
  context.json({
    service: "LedgerGuard",
    version: "0.1.0",
    mode: "non-custodial-read-only",
    mainnet: "disabled",
    arc5042Shadow: getArcMainnetShadowConfiguration().enabled
      ? "read-only"
      : "disabled",
    x402Testnet: x402Enabled() ? "enabled" : "disabled",
    docs: "/docs",
    openapi: "/openapi.json",
    catalog: "/.well-known/ledgerguard.json",
    testing: "/test",
    developerConsole: "/developer",
    mcp: "/mcp",
    commercialCandidate: "/v1/commercial-candidate",
    tenantApi:
      getTenantStore() && selfServiceEnabled() ? "enabled" : "disabled",
    support:
      "https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose",
    requestTracking: "X-LedgerGuard-Request-Id",
  }),
);

function bearerApiKey(value: string | undefined): string | null {
  const match = value?.match(/^Bearer ([^\s]+)$/i);
  return match?.[1] ?? null;
}

async function authenticatedTenant(
  authorization: string | undefined,
): Promise<
  | { ok: true; tenant: Tenant; apiKey: string }
  | { ok: false; status: 401 | 503; error: string }
> {
  const store = getTenantStore();
  if (!store) {
    return { ok: false, status: 503, error: "DURABLE_STORE_UNAVAILABLE" };
  }
  const apiKey = bearerApiKey(authorization);
  if (!apiKey) return { ok: false, status: 401, error: "API_KEY_REQUIRED" };
  const tenant = await store.authenticate(apiKey);
  return tenant
    ? { ok: true, tenant, apiKey }
    : { ok: false, status: 401, error: "INVALID_API_KEY" };
}

async function runPreflight(input: PreflightInput) {
  requireEnabledNetwork(input.network);
  const client = createNetworkClient(input.network);
  const simulation = await simulateReadOnly(client, {
    ...(input.from ? { from: getAddress(input.from) as Address } : {}),
    to: getAddress(input.to) as Address,
    data: input.data as Hex,
    value: BigInt(input.valueWei),
  });
  return evaluatePreflight(input, simulation);
}

app.post("/v1/developer/register", async (context) => {
  if (!selfServiceEnabled()) {
    return context.json(
      {
        error: "REGISTRATION_DISABLED",
        message: "Developer self-service registration is not enabled.",
      },
      503,
    );
  }
  const store = getTenantStore();
  if (!store) {
    return context.json(
      {
        error: "DURABLE_STORE_UNAVAILABLE",
        message: "Developer accounts require the shared durable store.",
      },
      503,
    );
  }
  const parsed = developerRegistrationSchema.safeParse(
    await context.req.json().catch(() => null),
  );
  if (!parsed.success) {
    return context.json(
      { error: "INVALID_REQUEST", issues: parsed.error.issues },
      400,
    );
  }
  try {
    const registration = await store.register(parsed.data.name);
    return context.json(
      {
        tenant: registration.tenant,
        apiKey: registration.apiKey,
        apiKeyNotice:
          "Save this test key now. LedgerGuard stores only its hash and cannot display it again.",
      },
      201,
    );
  } catch (error) {
    if (error instanceof TenantCapacityError) {
      return context.json(
        {
          error: "TENANT_CAPACITY_REACHED",
          message:
            "The bounded public testnet cohort is full. Use the support link to request the next slot.",
        },
        429,
      );
    }
    return context.json(
      {
        error: "DURABLE_STORE_UNAVAILABLE",
        message: "The developer account could not be created.",
      },
      503,
    );
  }
});

app.get("/v1/developer/account", async (context) => {
  const auth = await authenticatedTenant(context.req.header("authorization"));
  if (!auth.ok) return context.json({ error: auth.error }, auth.status);
  const store = getTenantStore();
  if (!store) return context.json({ error: "DURABLE_STORE_UNAVAILABLE" }, 503);
  try {
    return context.json({
      tenant: auth.tenant,
      usage: await store.usage(auth.tenant),
    });
  } catch {
    return context.json({ error: "DURABLE_STORE_UNAVAILABLE" }, 503);
  }
});

app.post("/v1/developer/keys/rotate", async (context) => {
  const auth = await authenticatedTenant(context.req.header("authorization"));
  if (!auth.ok) return context.json({ error: auth.error }, auth.status);
  const store = getTenantStore();
  if (!store) return context.json({ error: "DURABLE_STORE_UNAVAILABLE" }, 503);
  try {
    const apiKey = await store.rotateKey(
      auth.tenant,
      auth.apiKey,
    );
    return context.json({
      apiKey,
      apiKeyNotice:
        "The previous key is revoked. Save this replacement now; it is displayed only once.",
    });
  } catch {
    return context.json({ error: "DURABLE_STORE_UNAVAILABLE" }, 503);
  }
});

app.post("/v1/developer/preflight", async (context) => {
  const auth = await authenticatedTenant(context.req.header("authorization"));
  if (!auth.ok) return context.json({ error: auth.error }, auth.status);
  const parsed = preflightSchema.safeParse(
    await context.req.json().catch(() => null),
  );
  if (!parsed.success) {
    return context.json(
      { error: "INVALID_REQUEST", issues: parsed.error.issues },
      400,
    );
  }
  const store = getTenantStore();
  if (!store) return context.json({ error: "DURABLE_STORE_UNAVAILABLE" }, 503);
  const requestId = context.get("requestId") as string;
  try {
    const usage = await store.recordUsage(
      auth.tenant,
      "preflight",
      requestId,
    );
    const result = await runPreflight(parsed.data);
    return context.json({ ...result, usage });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return context.json(
        { error: "QUOTA_EXCEEDED", usage: error.usage },
        429,
      );
    }
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("disabled")
    ) {
      return context.json(
        { error: "NETWORK_DISABLED", message: error.message },
        503,
      );
    }
    return context.json(
      {
        error: "DEVELOPER_PREFLIGHT_UNAVAILABLE",
        message: "The metered preflight request could not be completed.",
      },
      503,
    );
  }
});

app.post("/v1/developer/shadow", async (context) => {
  const auth = await authenticatedTenant(context.req.header("authorization"));
  if (!auth.ok) return context.json({ error: auth.error }, auth.status);
  const parsed = preflightSchema.safeParse(
    await context.req.json().catch(() => null),
  );
  if (!parsed.success) {
    return context.json(
      { error: "INVALID_REQUEST", issues: parsed.error.issues },
      400,
    );
  }
  const store = getTenantStore();
  if (!store) return context.json({ error: "DURABLE_STORE_UNAVAILABLE" }, 503);
  const requestId = context.get("requestId") as string;
  try {
    const usage = await store.recordUsage(auth.tenant, "shadow", requestId);
    const result = await runPreflight(parsed.data);
    return context.json({
      mode: "shadow" as const,
      enforced: false as const,
      wouldDecision: result.decision,
      signingEnabled: false as const,
      custody: "none" as const,
      decoded: result.decoded,
      simulation: result.simulation,
      findings: result.findings,
      usage,
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return context.json(
        { error: "QUOTA_EXCEEDED", usage: error.usage },
        429,
      );
    }
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("disabled")
    ) {
      return context.json(
        { error: "NETWORK_DISABLED", message: error.message },
        503,
      );
    }
    return context.json(
      {
        error: "DEVELOPER_SHADOW_UNAVAILABLE",
        message: "The shadow request could not be completed.",
      },
      503,
    );
  }
});

app.all("/mcp", async (context) => {
  const auth = await authenticatedTenant(context.req.header("authorization"));
  if (!auth.ok) return context.json({ error: auth.error }, auth.status);
  const store = getTenantStore();
  if (!store) return context.json({ error: "DURABLE_STORE_UNAVAILABLE" }, 503);
  const requestId = context.get("requestId") as string;
  const metered = async (
    operation: "mcp.preflight" | "mcp.shadow" | "mcp.evidence",
  ) => store.recordUsage(auth.tenant, operation, `${requestId}:${operation}`);
  const server = createLedgerGuardMcpServer({
    preflight: async (input) => {
      const usage = await metered("mcp.preflight");
      return { ...(await runPreflight(input)), usage };
    },
    shadow: async (input) => {
      const usage = await metered("mcp.shadow");
      const result = await runPreflight(input);
      return {
        mode: "shadow",
        enforced: false,
        wouldDecision: result.decision,
        signingEnabled: false,
        custody: "none",
        decoded: result.decoded,
        simulation: result.simulation,
        findings: result.findings,
        usage,
      };
    },
    evidence: async (input) => {
      const usage = await metered("mcp.evidence");
      return { ...(await retrieveEvidence(input)), usage };
    },
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(context.req.raw);
});

app.get("/health", (context) =>
  context.json({
    ok: true,
    service: "ledgerguard",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/ready", async (context) => {
  try {
    const tenantStore = getTenantStore();
    if (
      selfServiceEnabled() &&
      (!tenantStore || !(await tenantStore.health()))
    ) {
      return context.json(
        {
          ok: false,
          error: "DURABLE_STORE_UNAVAILABLE",
        },
        503,
      );
    }
    const network = requireEnabledNetwork("arcTestnet");
    const { chainId, blockNumber } = await probeRpc(network.rpcUrls);
    if (chainId !== network.chainId) {
      return context.json(
        {
          ok: false,
          error: "RPC_CHAIN_ID_MISMATCH",
          expected: network.chainId,
          actual: chainId,
        },
        503,
      );
    }
    return context.json({
      ok: true,
      network: network.name,
      chainId,
      blockNumber: blockNumber.toString(),
      developerSelfService:
        selfServiceEnabled() && tenantStore ? "ready" : "disabled",
    });
  } catch (error) {
    console.error("Readiness RPC probe failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    });
    return context.json(
      {
        ok: false,
        error: "RPC_UNAVAILABLE",
        message: "Arc Testnet RPC is temporarily unavailable.",
      },
      503,
    );
  }
});

app.get("/v1/networks", (context) => {
  const registry = getNetworkRegistry();
  const shadow = getArcMainnetShadowConfiguration();
  return context.json({
    networks: Object.values(registry).map((network) => {
      const { rpcUrls, ...publicNetwork } = network;
      return {
        ...publicNetwork,
        rpcConfigured: rpcUrls.length > 0,
      };
    }),
    shadows: [
      {
        name: "arcMainnet5042",
        enabled: shadow.enabled,
        ready: shadow.ready,
        mode: shadow.mode,
        releaseStage: shadow.releaseStage,
        chainId: shadow.chainId,
        rpcHosts: shadow.rpcHosts,
        observerHosts: shadow.observerHosts,
        minimumHealthyRpcs: shadow.minimumHealthyRpcs,
        minimumHealthyObservers: shadow.minimumHealthyObservers,
        maximumBlockLag: shadow.maximumBlockLag,
        configFingerprint: shadow.configFingerprint,
        realFundsEnabled: false,
        signingEnabled: false,
        x402MainnetEnabled: false,
        reason: shadow.reason,
      },
    ],
  });
});

app.get("/v1/shadow/arc-mainnet", async (context) => {
  const status = await getArcMainnetShadowStatus();
  return context.json(status, status.ok ? 200 : 503);
});

app.get("/v1/paid/network-risk", async (context) => {
  if (!x402Enabled()) {
    return context.json(
      {
        error: "X402_DISABLED",
        message: "The paid testnet endpoint is not enabled.",
      },
      503,
    );
  }

  try {
    const requirements = await getArcPaymentRequirements();
    const signature = context.req.header("payment-signature");
    if (!signature) {
      context.header(
        "PAYMENT-REQUIRED",
        encodePaymentRequired(
          `${getPublicBaseUrl()}/v1/paid/network-risk`,
          requirements,
        ),
      );
      return context.json(
        {
          error: "PAYMENT_REQUIRED",
          priceMicroUsdc: requirements.amount,
          network: requirements.network,
        },
        402,
      );
    }

    const settlement = await settlePayment(signature, requirements);
    if (!settlement.success) {
      return context.json(
        {
          error: "PAYMENT_FAILED",
          reason: "Settlement rejected by the facilitator.",
        },
        402,
      );
    }

    context.header(
      "PAYMENT-RESPONSE",
      Buffer.from(JSON.stringify(settlement)).toString("base64"),
    );
    const receipt = paymentReceipt({
      payer: settlement.payer ?? "unknown",
      transaction: settlement.transaction,
      amountMicroUsdc: requirements.amount,
    });
    const requestId = context.get("requestId") as string;
    console.info({
      event: "payment.settled",
      requestId,
      ...receipt,
    });
    let ledgerStatus: "recorded" | "duplicate" | "unavailable" = "unavailable";
    const tenantStore = getTenantStore();
    if (tenantStore) {
      try {
        ledgerStatus = await tenantStore.recordPayment({
          requestId,
          payer: receipt.payer,
          settlementTransaction: receipt.settlementTransaction,
          amountMicroUsdc: receipt.amountMicroUsdc,
          network: "arcTestnet",
          recordedAt: new Date().toISOString(),
        });
      } catch {
        console.error({
          event: "payment.ledger_unavailable",
          requestId,
          settlementTransaction: receipt.settlementTransaction,
        });
      }
    }
    await notifyPaymentSettlement({
      requestId,
      payer: receipt.payer,
      transaction: receipt.settlementTransaction,
      amountMicroUsdc: receipt.amountMicroUsdc,
    });
    const arc = requireEnabledNetwork("arcTestnet");
    return context.json({
      paid: true,
      payer: receipt.payer,
      settlementTransaction: receipt.settlementTransaction,
      receipt,
      ledgerStatus,
      networkRisk: {
        lifecycle: arc.lifecycle,
        mainnetEnabled: getNetworkRegistry().arcMainnet.enabled,
        custody: "none",
        signing: "client-side-only",
        recommendation: "Use test assets only.",
      },
    });
  } catch (error) {
    if (error instanceof InvalidPaymentSignatureError) {
      return context.json(
        {
          error: "PAYMENT_FAILED",
          reason: "The payment signature is malformed or unsupported.",
        },
        402,
      );
    }
    console.error("x402 request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    });
    return context.json(
      {
        error: "X402_UNAVAILABLE",
        message: "The testnet payment facilitator is temporarily unavailable.",
      },
      503,
    );
  }
});

app.post("/v1/paid/evidence", async (context) => {
  if (!x402Enabled()) {
    return context.json(
      {
        error: "X402_DISABLED",
        message: "The paid testnet endpoint is not enabled.",
      },
      503,
    );
  }
  const parsed = evidenceSchema.safeParse(
    await context.req.json().catch(() => null),
  );
  if (!parsed.success) {
    return context.json(
      { error: "INVALID_REQUEST", issues: parsed.error.issues },
      400,
    );
  }

  try {
    const evidence = await retrieveEvidence(parsed.data);
    const requirements = await getArcPaymentRequirements();
    const signature = context.req.header("payment-signature");
    if (!signature) {
      context.header(
        "PAYMENT-REQUIRED",
        encodePaymentRequired(
          `${getPublicBaseUrl()}/v1/paid/evidence`,
          requirements,
          {
            description:
              "Strict LedgerGuard payment evidence receipt for an Arc transaction",
            extensions: {
              ledgerguard: {
                mode: "strict-evidence",
                custody: "none",
                signing: false,
              },
              ...strictEvidenceDiscoveryExtension(),
            },
          },
        ),
      );
      return context.json(
        {
          error: "PAYMENT_REQUIRED",
          priceMicroUsdc: requirements.amount,
          network: requirements.network,
          deliverable: "strict-evidence-receipt",
        },
        402,
      );
    }

    const settlement = await settlePayment(signature, requirements);
    if (!settlement.success) {
      return context.json(
        {
          error: "PAYMENT_FAILED",
          reason: "Settlement rejected by the facilitator.",
        },
        402,
      );
    }
    context.header(
      "PAYMENT-RESPONSE",
      Buffer.from(JSON.stringify(settlement)).toString("base64"),
    );
    const receipt = paymentReceipt({
      payer: settlement.payer ?? "unknown",
      transaction: settlement.transaction,
      amountMicroUsdc: requirements.amount,
    });
    const requestId = context.get("requestId") as string;
    let ledgerStatus: "recorded" | "duplicate" | "unavailable" = "unavailable";
    const tenantStore = getTenantStore();
    if (tenantStore) {
      try {
        ledgerStatus = await tenantStore.recordPayment({
          requestId,
          payer: receipt.payer,
          settlementTransaction: receipt.settlementTransaction,
          amountMicroUsdc: receipt.amountMicroUsdc,
          network: "arcTestnet",
          recordedAt: new Date().toISOString(),
        });
      } catch {
        console.error({
          event: "payment.ledger_unavailable",
          requestId,
          settlementTransaction: receipt.settlementTransaction,
        });
      }
    }
    await notifyPaymentSettlement({
      requestId,
      payer: receipt.payer,
      transaction: receipt.settlementTransaction,
      amountMicroUsdc: receipt.amountMicroUsdc,
    });
    return context.json({
      paid: true,
      deliverable: "strict-evidence-receipt",
      receipt,
      ledgerStatus,
      evidence,
    });
  } catch (error) {
    if (error instanceof InvalidPaymentSignatureError) {
      return context.json(
        {
          error: "PAYMENT_FAILED",
          reason: "The payment signature is malformed or unsupported.",
        },
        402,
      );
    }
    if (error instanceof TransactionNotFoundError) {
      return context.json(
        { error: "TRANSACTION_NOT_FOUND", message: error.message },
        404,
      );
    }
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("disabled")
    ) {
      return context.json(
        { error: "NETWORK_DISABLED", message: error.message },
        503,
      );
    }
    console.error("Paid evidence request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message:
        error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    });
    return context.json(
      {
        error: "PAID_EVIDENCE_UNAVAILABLE",
        message: "The paid evidence resource is temporarily unavailable.",
      },
      503,
    );
  }
});

app.get("/openapi.json", (context) => context.json(openApiDocument));

app.post("/v1/preflight", async (context) => {
  const parsed = preflightSchema.safeParse(await context.req.json().catch(() => null));
  if (!parsed.success) {
    return context.json(
      { error: "INVALID_REQUEST", issues: parsed.error.issues },
      400,
    );
  }

  try {
    requireEnabledNetwork(parsed.data.network);
  } catch (error) {
    return context.json(
      {
        error: "NETWORK_DISABLED",
        message: error instanceof Error ? error.message : "Network disabled",
      },
      503,
    );
  }

  return context.json(await runPreflight(parsed.data));
});

app.post("/v1/evidence", async (context) => {
  const parsed = evidenceSchema.safeParse(await context.req.json().catch(() => null));
  if (!parsed.success) {
    return context.json(
      { error: "INVALID_REQUEST", issues: parsed.error.issues },
      400,
    );
  }

  try {
    return context.json(await retrieveEvidence(parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (error instanceof TransactionNotFoundError) {
      return context.json(
        { error: "TRANSACTION_NOT_FOUND", message: "Transaction not found." },
        404,
      );
    }
    if (message.includes("disabled")) {
      return context.json(
        { error: "NETWORK_DISABLED", message: "Requested network is disabled." },
        503,
      );
    }
    console.error("Evidence RPC request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: message.slice(0, 500),
    });
    return context.json(
      { error: "RPC_ERROR", message: "Unable to retrieve onchain evidence." },
      503,
    );
  }
});

app.notFound((context) =>
  context.json({ error: "NOT_FOUND", path: context.req.path }, 404),
);

app.onError((error, context) => {
  console.error("Unhandled request error", {
    name: error.name,
    message: error.message,
  });
  return context.json({ error: "INTERNAL_ERROR" }, 500);
});

// Vercel's native Hono detector treats src/app.ts as the production entrypoint.
export default app;
