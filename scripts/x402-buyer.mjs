import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const TARGET_URL =
  process.env.X402_TARGET_URL ??
  "https://ledgerguard-gules.vercel.app/v1/paid/network-risk";
const SECRET_FILE = resolve(".env.x402-buyer.local");
const EVIDENCE_FILE = resolve("tmp/x402-payment-evidence.json");

export const EXPECTED = Object.freeze({
  network: "eip155:5042002",
  asset: "0x3600000000000000000000000000000000000000",
  amount: "1000",
  payTo: "0xf1437d9cd304ae49f2ec005ac967813b3a7c466c",
  verifyingContract: "0x0077777d7eba4688bdef3e311b846f25870a19b9",
});

function fail(message) {
  throw new Error(message);
}

function sameAddress(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

export function assertRequirements(requirements) {
  if (requirements?.scheme !== "exact") fail("Unexpected x402 scheme.");
  if (requirements?.network !== EXPECTED.network) fail("Unexpected x402 network.");
  if (!sameAddress(requirements?.asset, EXPECTED.asset)) fail("Unexpected x402 asset.");
  if (String(requirements?.amount) !== EXPECTED.amount) fail("Unexpected x402 amount.");
  if (!sameAddress(requirements?.payTo, EXPECTED.payTo)) fail("Unexpected x402 recipient.");
  if (
    !sameAddress(
      requirements?.extra?.verifyingContract,
      EXPECTED.verifyingContract,
    )
  ) {
    fail("Unexpected Circle Gateway verifying contract.");
  }
}

async function getRequirements() {
  const response = await fetch(TARGET_URL, { redirect: "error" });
  if (response.status !== 402) fail(`Expected HTTP 402, received ${response.status}.`);
  const encoded = response.headers.get("payment-required");
  if (!encoded) fail("Missing Payment-Required header.");
  const challenge = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  if (challenge?.resource?.url !== TARGET_URL) fail("Unexpected paid resource URL.");
  if (!Array.isArray(challenge.accepts) || challenge.accepts.length !== 1) {
    fail("Expected exactly one payment option.");
  }
  assertRequirements(challenge.accepts[0]);
  return challenge.accepts[0];
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
    `X402_BUYER_PRIVATE_KEY=${privateKey}\n`,
    { encoding: "utf8", mode: 0o600, flag: "wx" },
  );
  return { created: true, address: privateKeyToAccount(privateKey).address };
}

function getClient() {
  const privateKey = process.env.X402_BUYER_PRIVATE_KEY;
  if (!privateKey) {
    fail(
      "Buyer key is unavailable. Run `npm run x402:buyer:init`, then rerun with the local env file.",
    );
  }
  return new GatewayClient({
    chain: "arcTestnet",
    privateKey,
    rpcUrl: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.io",
  });
}

function safeBalances(client, balances, nativeBalance) {
  return {
    address: client.address,
    chain: client.chainName,
    nativeAtomic: nativeBalance.toString(),
    walletUsdc: balances.wallet.formatted,
    gatewayTotalUsdc: balances.gateway.formattedTotal,
    gatewayAvailableUsdc: balances.gateway.formattedAvailable,
  };
}

async function main() {
  const command = process.argv[2] ?? "inspect";

  if (command === "init") {
    const result = initializeWallet();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const requirements = await getRequirements();
  if (command === "inspect") {
    console.log(JSON.stringify({ target: TARGET_URL, requirements }, null, 2));
    return;
  }

  const client = getClient();
  const before = await client.getBalances();
  const nativeBalance = await client.publicClient.getBalance({
    address: client.address,
  });

  if (command === "status") {
    console.log(JSON.stringify(safeBalances(client, before, nativeBalance), null, 2));
    return;
  }

  if (command === "deposit") {
    const amount = process.argv[3] ?? "0.01";
    if (amount !== "0.01") fail("This test helper only permits a 0.01 USDC deposit.");
    const result = await client.deposit(amount);
    console.log(
      JSON.stringify(
        {
          depositor: result.depositor,
          amount: result.formattedAmount,
          approvalTxHash: result.approvalTxHash,
          depositTxHash: result.depositTxHash,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command !== "pay") fail(`Unknown command: ${command}`);
  if (BigInt(before.gateway.available) < BigInt(EXPECTED.amount)) {
    fail("Gateway balance is insufficient for the 0.001 USDC test payment.");
  }

  client.onBeforePaymentCreation(async ({ selectedRequirements }) => {
    assertRequirements(selectedRequirements);
  });

  const paid = await client.pay(TARGET_URL);
  if (paid.status !== 200) fail(`Paid request returned HTTP ${paid.status}.`);
  if (paid.formattedAmount !== "0.001") fail("Unexpected settled payment amount.");
  if (paid.data?.paid !== true) fail("Paid resource did not confirm payment.");
  const receipt = paid.data?.receipt;
  if (!sameAddress(receipt?.payer ?? paid.data?.payer, client.address)) {
    fail("Unexpected payer in response.");
  }
  if (receipt?.network !== "arcTestnet") fail("Unexpected receipt network.");
  if (receipt?.amountMicroUsdc !== EXPECTED.amount) {
    fail("Unexpected receipt amount.");
  }
  if (!String(receipt?.explorerUrl ?? "").startsWith("https://testnet.arcscan.app/tx/")) {
    fail("Missing Arc Testnet receipt link.");
  }

  const after = await client.getBalances();
  const evidence = {
    verifiedAt: new Date().toISOString(),
    target: TARGET_URL,
    network: EXPECTED.network,
    asset: EXPECTED.asset,
    amountMicroUsdc: EXPECTED.amount,
    amountUsdc: paid.formattedAmount,
    recipient: EXPECTED.payTo,
    payer: client.address,
    status: paid.status,
    transaction: paid.transaction,
    resourceConfirmedPaid: paid.data.paid,
    resourceSettlementTransaction:
      receipt?.settlementTransaction ?? paid.data.settlementTransaction,
    explorerUrl: receipt?.explorerUrl,
    balanceBefore: before.gateway.formattedAvailable,
    balanceAfter: after.gateway.formattedAvailable,
  };
  mkdirSync(dirname(EVIDENCE_FILE), { recursive: true });
  writeFileSync(EVIDENCE_FILE, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(evidence, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
