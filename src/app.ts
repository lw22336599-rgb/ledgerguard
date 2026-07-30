import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { getAddress, type Address, type Hex } from "viem";
import { getNetworkRegistry, requireEnabledNetwork } from "./config/networks.js";
import { getPublicBaseUrl } from "./config/public.js";
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
import { evidenceSchema, preflightSchema } from "./schemas.js";
import { buildEvidence } from "./services/evidence.js";
import { evaluatePreflight } from "./services/preflight.js";
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
  catalogHtml,
  demoCss,
  demoHtml,
  demoJs,
  developerDocsHtml,
  faviconSvg,
  integrationBoundaryHtml,
  statusHtml,
  testerHtml,
} from "./ui.js";

export const app = new Hono<AppEnvironment>();

app.use("*", requestTelemetry);
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Payment-Signature",
      "X-LedgerGuard-Client",
    ],
    exposeHeaders: [
      "Payment-Required",
      "Payment-Response",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
      "Retry-After",
      "X-LedgerGuard-Request-Id",
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
    context.req.path === "/ready"
  ) {
    context.header("Cache-Control", "no-store");
  }
  await next();
});
app.use("/v1/*", rateLimit);
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
    ],
  }),
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
    support:
      "https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose",
    requestTracking: "X-LedgerGuard-Request-Id",
  }),
);

app.get("/health", (context) =>
  context.json({
    ok: true,
    service: "ledgerguard",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/ready", async (context) => {
  try {
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

  const client = createNetworkClient(parsed.data.network);
  const simulation = await simulateReadOnly(client, {
    ...(parsed.data.from
      ? { from: getAddress(parsed.data.from) as Address }
      : {}),
    to: getAddress(parsed.data.to) as Address,
    data: parsed.data.data as Hex,
    value: BigInt(parsed.data.valueWei),
  });

  return context.json(evaluatePreflight(parsed.data, simulation));
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
    requireEnabledNetwork(parsed.data.network);
    const client = createNetworkClient(parsed.data.network);
    const txHash = parsed.data.txHash as Hex;
    const [transaction, receipt] = await withDeadline(
      Promise.all([
        client.getTransaction({ hash: txHash }),
        client.getTransactionReceipt({ hash: txHash }),
      ]),
      12_000,
    );
    let recipientHasCode: boolean | undefined;
    if (transaction.to !== null) {
      try {
        const bytecode = await withDeadline(
          client.getBytecode({
            address: transaction.to,
            blockNumber: receipt.blockNumber,
          }),
          8_000,
        );
        recipientHasCode = Boolean(bytecode && bytecode !== "0x");
      } catch (error) {
        console.warn("Recipient bytecode lookup failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          message:
            error instanceof Error
              ? error.message.slice(0, 500)
              : "Unknown error",
        });
      }
    }
    return context.json(
      buildEvidence(parsed.data, transaction, receipt, recipientHasCode),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("could not be found") || message.includes("not found")) {
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
