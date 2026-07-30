/**
 * Headless Base Mainnet x402 canary payer using a local private key.
 * Reads BASE_MAINNET_PAYER_PRIVATE_KEY or .env.base-mainnet-buyer.local
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const TARGET_URL =
  process.env.BASE_MAINNET_TARGET_URL ??
  "https://ledgerguard-gules.vercel.app/v1/paid/base/evidence";
const EVIDENCE_FILE = resolve("tmp/base-mainnet-canary-evidence.json");
const CANARY_TX =
  "0x2b536c8c0c6789482c0792290c1f310cb5a75532247ac394270707015c02098b";
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
};

function loadPrivateKey() {
  if (process.env.BASE_MAINNET_PAYER_PRIVATE_KEY?.trim()) {
    return process.env.BASE_MAINNET_PAYER_PRIVATE_KEY.trim();
  }
  const line = readFileSync(resolve(".env.base-mainnet-buyer.local"), "utf8").trim();
  return line.split("=", 2)[1];
}

const privateKey = loadPrivateKey();
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? "https://mainnet.base.org"),
});
const signer = toClientEvmSigner(account, publicClient);
const client = new x402Client();
registerExactEvmScheme(client, {
  signer,
  schemeOptions: { 8453: { rpcUrl: process.env.BASE_RPC_URL ?? "https://mainnet.base.org" } },
  networks: ["eip155:8453"],
});
const httpClient = new x402HTTPClient(client);

const bodyText = JSON.stringify(CANARY_EVIDENCE_BODY);
const challenge = await fetch(TARGET_URL, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: bodyText,
});
if (challenge.status !== 402) {
  const err = await challenge.text();
  throw new Error(`Expected HTTP 402, got ${challenge.status}: ${err}`);
}

const paymentRequired = httpClient.getPaymentRequiredResponse(
  (name) => challenge.headers.get(name),
  await challenge.json().catch(() => undefined),
);
const payTo = paymentRequired.accepts?.[0]?.payTo;
if (payTo?.toLowerCase() === account.address.toLowerCase()) {
  throw new Error(
    `Payer ${account.address} equals payTo ${payTo}. Use a different funded wallet as payer.`,
  );
}

console.log(JSON.stringify({ payer: account.address, payTo, amount: paymentRequired.accepts?.[0]?.amount }));

const paymentPayload = await client.createPaymentPayload(paymentRequired);
const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
const response = await fetch(TARGET_URL, {
  method: "POST",
  headers: { "content-type": "application/json", ...paymentHeaders },
  body: bodyText,
});
const body = await response.json();
if (!response.ok || body?.paid !== true) {
  throw new Error(`Paid request failed HTTP ${response.status}: ${JSON.stringify(body)}`);
}

const settlement = httpClient.getPaymentSettleResponse((name) => response.headers.get(name));
const evidence = {
  verifiedAt: new Date().toISOString(),
  target: TARGET_URL,
  payer: account.address,
  recipient: payTo,
  amountUsdc: "0.001",
  settlement,
  response: body,
};
mkdirSync(dirname(EVIDENCE_FILE), { recursive: true });
writeFileSync(EVIDENCE_FILE, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify(evidence, null, 2));
