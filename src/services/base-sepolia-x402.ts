import { createFacilitatorConfig } from "@coinbase/x402";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { bazaarResourceServerExtension } from "@x402/extensions/bazaar";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import type { MiddlewareHandler } from "hono";
import {
  BASE_SEPOLIA_NETWORK,
  BASE_SEPOLIA_USDC,
  getBazaarCandidate,
} from "../config/bazaar.js";
import { getPublicBaseUrl } from "../config/public.js";
import type { AppEnvironment } from "../middleware/request-telemetry.js";
import { strictEvidenceDiscoveryExtension } from "./discovery.js";
import { getConfiguredX402PriceMicroUsdc } from "./x402.js";

export const BAZAAR_EVIDENCE_PATH = "/v1/paid/base-sepolia/evidence";

let cachedMiddleware: MiddlewareHandler<AppEnvironment> | undefined;

export function resetBaseSepoliaPaymentMiddlewareForTests(): void {
  cachedMiddleware = undefined;
}

function createBaseSepoliaPaymentMiddleware(): MiddlewareHandler<AppEnvironment> {
  const candidate = getBazaarCandidate();
  const apiKeyId = process.env.CDP_API_KEY_ID?.trim();
  const apiKeySecret = process.env.CDP_API_KEY_SECRET?.trim();
  if (
    !candidate.ready ||
    !candidate.sellerAddress ||
    !apiKeyId ||
    !apiKeySecret
  ) {
    throw new Error("The CDP Bazaar testnet activation gates are incomplete.");
  }

  const facilitator = new HTTPFacilitatorClient(
    createFacilitatorConfig(apiKeyId, apiKeySecret),
  );
  const resourceServer = new x402ResourceServer(facilitator)
    .register(BASE_SEPOLIA_NETWORK, new ExactEvmScheme())
    .registerExtension(bazaarResourceServerExtension);

  return paymentMiddleware(
    {
      [`POST ${BAZAAR_EVIDENCE_PATH}`]: {
        accepts: {
          scheme: "exact",
          network: BASE_SEPOLIA_NETWORK,
          payTo: candidate.sellerAddress,
          price: {
            asset: BASE_SEPOLIA_USDC,
            amount: getConfiguredX402PriceMicroUsdc(),
          },
          maxTimeoutSeconds: 60,
        },
        resource: `${getPublicBaseUrl()}${BAZAAR_EVIDENCE_PATH}`,
        description:
          "Strict, non-custodial evidence receipt for an Arc Testnet transaction; payment settles with test USDC on Base Sepolia.",
        mimeType: "application/json",
        serviceName: "LedgerGuard",
        tags: ["transaction-safety", "evidence", "ai-agents", "usdc"],
        extensions: strictEvidenceDiscoveryExtension(),
      },
    },
    resourceServer,
    undefined,
    undefined,
    true,
  );
}

export const baseSepoliaPaymentGate: MiddlewareHandler<AppEnvironment> = async (
  context,
  next,
) => {
  const candidate = getBazaarCandidate();
  if (!candidate.ready) {
    return context.json(
      {
        error: "BAZAAR_TESTNET_NOT_READY",
        message:
          "Base Sepolia settlement is disabled until explicit enablement, CDP credentials, and a valid seller address are configured.",
        testAssetsOnly: true,
        indexed: false,
        activationGates: candidate.activationGates,
      },
      503,
    );
  }

  try {
    cachedMiddleware ??= createBaseSepoliaPaymentMiddleware();
    return await cachedMiddleware(context, next);
  } catch (error) {
    cachedMiddleware = undefined;
    console.error("CDP Bazaar testnet middleware failed closed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return context.json(
      {
        error: "BAZAAR_TESTNET_UNAVAILABLE",
        message:
          "The CDP testnet facilitator could not verify the protected resource.",
        testAssetsOnly: true,
        indexed: false,
      },
      503,
    );
  }
};
