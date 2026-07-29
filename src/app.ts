import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { getAddress, type Address, type Hex } from "viem";
import { getNetworkRegistry, requireEnabledNetwork } from "./config/networks.js";
import {
  createNetworkClient,
  probeRpc,
  simulateReadOnly,
  withDeadline,
} from "./lib/rpc.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { openApiDocument } from "./openapi.js";
import { evidenceSchema, preflightSchema } from "./schemas.js";
import { buildEvidence } from "./services/evidence.js";
import { evaluatePreflight } from "./services/preflight.js";
import {
  encodePaymentRequired,
  getArcPaymentRequirements,
  settlePayment,
  x402Enabled,
} from "./services/x402.js";
import { demoCss, demoHtml, demoJs } from "./ui.js";

export const app = new Hono();

app.use("*", cors());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use("/v1/*", async (context, next) => {
  context.header("Cache-Control", "no-store");
  await next();
});
app.use("/v1/*", rateLimit);
app.use(
  "/v1/*",
  bodyLimit({
    maxSize: 64 * 1024,
    onError: (context) =>
      context.json({ error: "REQUEST_BODY_TOO_LARGE" }, 413),
  }),
);

app.get("/", (context) => context.html(demoHtml));
app.get("/styles.css", (context) =>
  context.body(demoCss, 200, { "Content-Type": "text/css; charset=utf-8" }),
);
app.get("/app.js", (context) =>
  context.body(demoJs, 200, { "Content-Type": "text/javascript; charset=utf-8" }),
);
app.get("/v1/meta", (context) =>
  context.json({
    service: "LedgerGuard",
    version: "0.1.0",
    mode: "non-custodial-read-only",
    mainnet: "disabled",
    docs: "/openapi.json",
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
    return context.json(
      {
        ok: false,
        error: "RPC_UNAVAILABLE",
        message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      },
      503,
    );
  }
});

app.get("/v1/networks", (context) => {
  const registry = getNetworkRegistry();
  return context.json({
    networks: Object.values(registry).map((network) => {
      const { rpcUrls, ...publicNetwork } = network;
      return {
        ...publicNetwork,
        rpcConfigured: rpcUrls.length > 0,
      };
    }),
  });
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
        encodePaymentRequired(context.req.url, requirements),
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
          reason: settlement.errorReason ?? "Settlement rejected",
        },
        402,
      );
    }

    context.header(
      "PAYMENT-RESPONSE",
      Buffer.from(JSON.stringify(settlement)).toString("base64"),
    );
    const arc = requireEnabledNetwork("arcTestnet");
    return context.json({
      paid: true,
      payer: settlement.payer,
      settlementTransaction: settlement.transaction,
      networkRisk: {
        lifecycle: arc.lifecycle,
        mainnetEnabled: getNetworkRegistry().arcMainnet.enabled,
        custody: "none",
        signing: "client-side-only",
        recommendation: "Use test assets only.",
      },
    });
  } catch (error) {
    return context.json(
      {
        error: "X402_UNAVAILABLE",
        message:
          error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
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
    return context.json(buildEvidence(parsed.data, transaction, receipt));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("could not be found") || message.includes("not found")) {
      return context.json({ error: "TRANSACTION_NOT_FOUND", message }, 404);
    }
    if (message.includes("disabled")) {
      return context.json({ error: "NETWORK_DISABLED", message }, 503);
    }
    return context.json({ error: "RPC_ERROR", message: message.slice(0, 500) }, 503);
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
