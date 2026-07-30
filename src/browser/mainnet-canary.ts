import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { base } from "viem/chains";
import { BASE_MAINNET } from "./wallet-chains.js";

const CANARY_TX =
  "0x2b536c8c0c6789482c0792290c1f310cb5a75532247ac394270707015c02098b";
const SELLER_ADDRESS = "0xf1437d9cd304ae49f2ec005ac967813b3a7c466c";
const CANARY_EVIDENCE_BODY = {
  network: "arcTestnet",
  txHash: CANARY_TX,
  intent: {
    action: "transfer",
    expectedDebitAddress: "0x257713534b81f053200c94ecEFDc0aAfa92dF68F",
    expectedRecipient: "0xF1437d9CD304aE49f2ec005AC967813B3a7c466c",
    expectedAssetAddress: "0x3600000000000000000000000000000000000000",
    expectedAmountMicroUsdc: "10000",
    purpose: "Base Mainnet canary",
  },
} as const;

const connectButton = document.querySelector<HTMLButtonElement>("#canary-connect");
const switchButton = document.querySelector<HTMLButtonElement>("#canary-switch");
const payButton = document.querySelector<HTMLButtonElement>("#canary-pay");
const status = document.querySelector<HTMLParagraphElement>("#canary-status");
const output = document.querySelector<HTMLElement>("#canary-result");

function setStatus(message: string) {
  if (status) status.textContent = message;
}

function showResult(
  kind: "allow" | "review" | "error" | "neutral",
  text: string,
) {
  if (!output) return;
  output.hidden = false;
  output.className = `result ${kind}`;
  output.textContent = text;
}

function wallet() {
  const module = window.LedgerGuardWallet;
  if (!module) throw new Error("Wallet module did not load.");
  return module;
}

function sameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function chainLabel(chainId: string | undefined) {
  if (!chainId) return "unknown network";
  const numeric = Number.parseInt(chainId, 16);
  if (numeric === 8453) return "Base Mainnet";
  if (numeric === 84532) return "Base Sepolia (wrong network)";
  return `chain ${numeric}`;
}

async function requireBaseMainnet() {
  await wallet().ensureChain(BASE_MAINNET);
  const chainId = wallet().getState().chainId;
  if (Number.parseInt(chainId || "0", 16) !== 8453) {
    throw new Error(
      `MetaMask is still on ${chainLabel(chainId)}. Approve the switch to Base Mainnet, then try again.`,
    );
  }
  return chainId;
}

async function buildPaymentClient() {
  const provider = wallet().getProvider();
  if (!provider) throw new Error("Connect a wallet first.");

  const account = wallet().getState().account as `0x${string}`;
  if (!account) throw new Error("No connected account.");
  if (sameAddress(account, SELLER_ADDRESS)) {
    throw new Error(
      "This wallet is the settlement recipient. Switch MetaMask to a different Base account that holds USDC, then pay 0.001 USDC to complete the canary.",
    );
  }

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: custom(provider),
  });
  const publicClient = createPublicClient({
    chain: base,
    transport: http("https://mainnet.base.org"),
  });
  const signer = toClientEvmSigner(
    {
      address: account,
      signTypedData: (message) =>
        walletClient.signTypedData({
          account,
          domain: message.domain as Record<string, unknown>,
          types: message.types as Record<string, { name: string; type: string }[]>,
          primaryType: message.primaryType,
          message: message.message as Record<string, unknown>,
        }),
    },
    publicClient,
  );
  const client = new x402Client();
  registerExactEvmScheme(client, {
    signer,
    schemeOptions: { 8453: { rpcUrl: "https://mainnet.base.org" } },
    networks: ["eip155:8453"],
  });
  return { client, httpClient: new x402HTTPClient(client) };
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatFailure(status: number, body: Record<string, unknown>) {
  const issues = Array.isArray(body.issues)
    ? body.issues
        .map((issue) => {
          if (!issue || typeof issue !== "object") return null;
          const record = issue as { path?: unknown[]; message?: string };
          return `${String(record.path ?? []).replaceAll(",", ".")}: ${record.message ?? "invalid"}`;
        })
        .filter(Boolean)
        .join("; ")
    : "";
  return (
    issues ||
    (typeof body.message === "string" ? body.message : "") ||
    (typeof body.error === "string" ? body.error : "") ||
    `Request failed with HTTP ${status}.`
  );
}

connectButton?.addEventListener("click", async () => {
  connectButton.disabled = true;
  try {
    await wallet().connect();
    await requireBaseMainnet();
    const connected = wallet().getState().account;
    const chainId = wallet().getState().chainId;
    if (sameAddress(connected, SELLER_ADDRESS)) {
      setStatus(
        `Connected on ${chainLabel(chainId)}, but this wallet is the recipient. Switch MetaMask to a different Base account before signing.`,
      );
      if (payButton) payButton.disabled = true;
      return;
    }
    setStatus(
      `Connected on ${chainLabel(chainId)}: ${wallet().shortAddress(connected)}`,
    );
    if (payButton) payButton.disabled = false;
  } catch (error) {
    showResult(
      "error",
      error instanceof Error ? error.message : "Wallet connection failed.",
    );
  } finally {
    connectButton.disabled = false;
  }
});

switchButton?.addEventListener("click", async () => {
  switchButton.disabled = true;
  try {
    if (!wallet().getProvider()) {
      await wallet().connect();
    }
    await requireBaseMainnet();
    setStatus(`Network ready: ${chainLabel(wallet().getState().chainId)}`);
  } catch (error) {
    showResult(
      "error",
      error instanceof Error ? error.message : "Network switch failed.",
    );
  } finally {
    switchButton.disabled = false;
  }
});

payButton?.addEventListener("click", async () => {
  if (!payButton) return;
  payButton.disabled = true;
  setStatus(
    "Requesting the 402 challenge, then opening your wallet to sign 0.001 USDC…",
  );
  if (output) output.hidden = true;
  try {
    if (!wallet().getProvider()) {
      await wallet().connect();
    }
    await requireBaseMainnet();
    const { client, httpClient } = await buildPaymentClient();
    const bodyText = JSON.stringify(CANARY_EVIDENCE_BODY);
    const challenge = await fetch("/v1/paid/base/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: bodyText,
    });
    if (challenge.status !== 402) {
      const body = await readJson(challenge);
      throw new Error(formatFailure(challenge.status, body));
    }

    const paymentRequired = httpClient.getPaymentRequiredResponse(
      (name) => challenge.headers.get(name),
      await readJson(challenge),
    );
    const paymentPayload = await client.createPaymentPayload(paymentRequired);
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
    const response = await fetch("/v1/paid/base/evidence", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...paymentHeaders,
      },
      body: bodyText,
    });
    const body = await readJson(response);
    if (!response.ok) {
      throw new Error(formatFailure(response.status, body));
    }
    const settlement = httpClient.getPaymentSettleResponse((name) =>
      response.headers.get(name),
    );
    showResult(
      "allow",
      `Canary settled. paid=${String(body.paid)} · network=${String(body.paymentNetwork)} · settlement=${JSON.stringify(settlement)} · evidence=${JSON.stringify((body.evidence as { status?: string } | undefined)?.status ?? body)}`,
    );
    setStatus("Real-funds canary complete.");
  } catch (error) {
    showResult(
      "error",
      error instanceof Error ? error.message : "Canary payment failed.",
    );
    setStatus("Canary did not complete.");
  } finally {
    payButton.disabled = false;
  }
});

if (!window.LedgerGuardWallet) {
  setStatus("Wallet support did not load. Refresh and try again.");
  if (connectButton) connectButton.disabled = true;
}
