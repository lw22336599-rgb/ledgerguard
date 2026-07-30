import { createFacilitatorConfig } from "@coinbase/x402";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { bazaarResourceServerExtension } from "@x402/extensions/bazaar";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import type { MiddlewareHandler } from "hono";
import {
  BASE_MAINNET_EVIDENCE_PATH,
  BASE_MAINNET_NETWORK,
  BASE_MAINNET_USDC,
  BASE_MAINNET_USDC_EIP712_EXTRA,
  getCommercialCandidate,
} from "../config/commercial.js";
import { getPublicBaseUrl } from "../config/public.js";
import type { AppEnvironment } from "../middleware/request-telemetry.js";
import { strictEvidenceDiscoveryExtension } from "./discovery.js";

let cachedMiddleware: MiddlewareHandler<AppEnvironment> | undefined;

export function resetBaseMainnetPaymentMiddlewareForTests(): void {
  cachedMiddleware = undefined;
}

function createBaseMainnetPaymentMiddleware(): MiddlewareHandler<AppEnvironment> {
  const candidate = getCommercialCandidate();
  const apiKeyId = process.env.CDP_API_KEY_ID?.trim();
  const apiKeySecret = process.env.CDP_API_KEY_SECRET?.trim();
  if (
    !candidate.ready ||
    !candidate.sellerAddress ||
    !apiKeyId ||
    !apiKeySecret
  ) {
    throw new Error("The Base mainnet activation gates are incomplete.");
  }

  const facilitator = new HTTPFacilitatorClient(
    createFacilitatorConfig(apiKeyId, apiKeySecret),
  );
  const resourceServer = new x402ResourceServer(facilitator)
    .register(BASE_MAINNET_NETWORK, new ExactEvmScheme())
    .registerExtension(bazaarResourceServerExtension);

  return paymentMiddleware(
    {
      [`POST ${BASE_MAINNET_EVIDENCE_PATH}`]: {
        accepts: {
          scheme: "exact",
          network: BASE_MAINNET_NETWORK,
          payTo: candidate.sellerAddress,
          price: {
            asset: BASE_MAINNET_USDC,
            amount: candidate.priceMicroUsdc,
            extra: BASE_MAINNET_USDC_EIP712_EXTRA,
          },
          maxTimeoutSeconds: 60,
        },
        resource: `${getPublicBaseUrl()}${BASE_MAINNET_EVIDENCE_PATH}`,
        description:
          "Strict, non-custodial evidence receipt for an Arc transaction, paid in USDC on Base.",
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

export const baseMainnetPaymentGate: MiddlewareHandler<AppEnvironment> = async (
  context,
  next,
) => {
  const candidate = getCommercialCandidate();
  if (!candidate.ready) {
    return context.json(
      {
        error: "BASE_MAINNET_NOT_READY",
        message:
          "Base mainnet settlement is fail-closed until every canary activation gate passes.",
        realFundsEnabled: false,
        activationGates: candidate.activationGates,
        configFingerprint: candidate.configFingerprint,
      },
      503,
    );
  }

  try {
    cachedMiddleware ??= createBaseMainnetPaymentMiddleware();
    return await cachedMiddleware(context, next);
  } catch (error) {
    cachedMiddleware = undefined;
    console.error("Base mainnet x402 middleware failed closed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return context.json(
      {
        error: "BASE_MAINNET_UNAVAILABLE",
        message:
          "The production facilitator could not verify the protected resource.",
        realFundsEnabled: false,
      },
      503,
    );
  }
};
