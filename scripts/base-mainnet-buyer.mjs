import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const TARGET_URL =
  process.env.BASE_MAINNET_TARGET_URL ??
  "https://ledgerguard-gules.vercel.app/v1/paid/base/evidence";
const SECRET_FILE = resolve(".env.base-mainnet-buyer.local");
const EVIDENCE_FILE = resolve("tmp/base-mainnet-canary-evidence.json");
const CANARY_TX =
  process.env.BASE_MAINNET_CANARY_TX ??
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

export const EXPECTED = Object.freeze({
  network: "eip155:8453",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  amount: "1000",
  payTo: "0xf1437d9cd304ae49f2ec005ac967813b3a7c466c",
});

function fail(message) {
  throw new Error(message);
}

function sameAddress(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

function initializeWallet() {
  if (existsSync(SECRET_FILE)) {
    const line = readFileSync(SECRET_FILE, "utf8").trim();
    const privateKey = line.split("=", 2)[1];
    if (!privateKey) fail("Existing buyer secret file is malformed.");
    return { created: false, address: privateKeyToAccount(privateKey).address };
  }
  const privateKey = generatePrivateKey();
  writeFileSync(
    SECRET_FILE,
    `BASE_MAINNET_BUYER_PRIVATE_KEY=${privateKey}\n`,
    { encoding: "utf8", mode: 0o600, flag: "wx" },
  );
  return { created: true, address: privateKeyToAccount(privateKey).address };
}

function getSigner() {
  const privateKey = process.env.BASE_MAINNET_BUYER_PRIVATE_KEY;
  if (!privateKey) {
    fail(
      "Buyer key is unavailable. Run `npm run base-mainnet:buyer:init`, fund the address on Base Mainnet, then rerun.",
    );
  }
  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL ?? "https://mainnet.base.org"),
  });
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC_URL ?? "https://mainnet.base.org"),
  });
  return {
    address: account.address,
    signer: toClientEvmSigner(account, publicClient),
  };
}

async function getRequirements() {
  const response = await fetch(TARGET_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(CANARY_EVIDENCE_BODY),
    redirect: "error",
  });
  if (response.status !== 402) {
    fail(`Expected HTTP 402, received ${response.status}.`);
  }
  const httpClient = new x402HTTPClient(new x402Client());
  const paymentRequired = httpClient.getPaymentRequiredResponse((name) =>
    response.headers.get(name),
  );
  const requirements = paymentRequired.accepts?.[0];
  if (!requirements) fail("Missing payment requirements.");
  if (requirements.network !== EXPECTED.network) fail("Unexpected x402 network.");
  if (!sameAddress(requirements.asset, EXPECTED.asset)) {
    fail("Unexpected x402 asset.");
  }
  if (String(requirements.amount) !== EXPECTED.amount) {
    fail("Unexpected x402 amount.");
  }
  if (!sameAddress(requirements.payTo, EXPECTED.payTo)) {
    fail("Unexpected x402 recipient.");
  }
  return paymentRequired;
}

async function main() {
  const command = process.argv[2] ?? "inspect";

  if (command === "init") {
    console.log(JSON.stringify(initializeWallet(), null, 2));
    return;
  }

  if (command === "inspect") {
    const paymentRequired = await getRequirements();
    console.log(JSON.stringify({ target: TARGET_URL, paymentRequired }, null, 2));
    return;
  }

  if (command !== "pay") fail(`Unknown command: ${command}`);

  const { address, signer } = getSigner();
  const client = new x402Client();
  registerExactEvmScheme(client, {
    signer,
    schemeOptions: { 8453: { rpcUrl: process.env.BASE_RPC_URL ?? "https://mainnet.base.org" } },
    networks: ["eip155:8453"],
  });
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);
  const response = await fetchWithPayment(TARGET_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(CANARY_EVIDENCE_BODY),
  });
  const body = await response.json();
  if (!response.ok || body?.paid !== true) {
    fail(`Paid request returned HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  const httpClient = new x402HTTPClient(client);
  const settlement = httpClient.getPaymentSettleResponse((name) =>
    response.headers.get(name),
  );
  const evidence = {
    verifiedAt: new Date().toISOString(),
    target: TARGET_URL,
    payer: address,
    amountMicroUsdc: EXPECTED.amount,
    amountUsdc: "0.001",
    recipient: EXPECTED.payTo,
    status: response.status,
    settlement,
    response: body,
  };
  mkdirSync(dirname(EVIDENCE_FILE), { recursive: true });
  writeFileSync(EVIDENCE_FILE, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(evidence, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
