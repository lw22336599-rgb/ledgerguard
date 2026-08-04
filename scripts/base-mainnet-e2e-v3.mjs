/**
 * Base Mainnet real-fund E2E loop v3 — every step real, funds fully returned.
 * 1. preflight review (real engine call)
 * 2. fund temp wallet (real onchain tx)
 * 3. signed USDC transfer source -> temp (real onchain tx)
 * 4. signed return temp -> source (real onchain tx, deterministic key = recoverable)
 * 5. verify final balances (real RPC reads)
 *
 * Run: LG_SOURCE_PK=0x... node scripts/base-mainnet-e2e-v3.mjs
 */
import { createPublicClient, createWalletClient, http, parseAbi, getAddress, encodeFunctionData, createClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createHash } from "node:crypto";
import { base } from "viem/chains";

const PK = process.env.LG_SOURCE_PK;
if (!PK) throw new Error("LG_SOURCE_PK required");

const rpc = "https://mainnet.base.org";
const publicClient = createPublicClient({ chain: base, transport: http(rpc) });
const walletClient = createWalletClient({ chain: base, transport: http(rpc) });
const sourceAccount = privateKeyToAccount(PK);

const SOURCE = getAddress("0xF1437d9CD304aE49f2ec005AC967813B3a7c466c");
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const AMOUNT = 500_000n; // 0.5 USDC

// Deterministic temp wallet — private key always reproducible, so funds can return.
const salt = `ledgerguard-e2e-v3-${SOURCE.toLowerCase()}-2026-08-04`;
const tmpPk = "0x" + createHash("sha256").update(salt).digest("hex");
const tmpAccount = privateKeyToAccount(tmpPk);
const TMP = tmpAccount.address;

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
]);

function transferData(to, amount) {
  return encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [to, amount] });
}

async function usdcBalance(addr) {
  return publicClient.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [addr] });
}

async function main() {
  console.log("=== Base Mainnet real E2E loop v3 (funds fully returned) ===\n");
  console.log("temp wallet (deterministic):", TMP);

  const srcBal0 = await usdcBalance(SOURCE);
  console.log("1. source USDC:", (Number(srcBal0) / 1e6).toFixed(2));

  // Step 2: preflight review (real engine)
  const preflight = await fetch("https://ledgerguard-gules.vercel.app/v1/preflight", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      network: "baseMainnet",
      from: SOURCE.toLowerCase(),
      to: USDC.toLowerCase(),
      data: transferData(TMP, AMOUNT),
      valueWei: "0",
      intent: {
        action: "transfer",
        expectedDebitAddress: SOURCE.toLowerCase(),
        expectedRecipient: TMP.toLowerCase(),
        expectedAssetAddress: USDC.toLowerCase(),
        expectedAmountMicroUsdc: AMOUNT.toString(),
        purpose: "E2E demo: checkout settlement",
      },
      policy: {},
    }),
  }).then((r) => r.json());
  console.log("2. preflight decision:", preflight.decision, "| findings:", (preflight.findings ?? []).map((f) => f.code).join(",") || "none");

  // Step 3: fund temp wallet with gas ETH first, then transfer USDC
  const gasTx = await walletClient.sendTransaction({
    account: sourceAccount,
    to: TMP,
    value: 500_000_000_000_000n, // 0.0005 ETH gas
  });
  await publicClient.waitForTransactionReceipt({ hash: gasTx });
  console.log("3a. gas -> temp:", gasTx);

  const tx1 = await walletClient.sendTransaction({ account: sourceAccount, to: USDC, data: transferData(TMP, AMOUNT) });
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log("3b. USDC transfer -> temp:", tx1);

  // Step 4: temp returns funds (same deterministic key, real signature)
  const tx2 = await walletClient.sendTransaction({ account: tmpAccount, to: USDC, data: transferData(SOURCE, AMOUNT) });
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log("4. return -> source:", tx2);

  // Step 5: verify balances (real RPC)
  const tmpBal = await usdcBalance(TMP);
  const srcBal1 = await usdcBalance(SOURCE);
  console.log("5. temp USDC final:", (Number(tmpBal) / 1e6).toFixed(2));
  console.log("   source USDC final:", (Number(srcBal1) / 1e6).toFixed(2), "(started", (Number(srcBal0) / 1e6).toFixed(2) + ")");

  const ok = tmpBal === 0n && srcBal1 === srcBal0;
  console.log("\n=== RESULT:", ok ? "FULLY RETURNED ✅" : "CHECK NEEDED ⚠️", "===");
  console.log(JSON.stringify({ preflight: preflight.decision, txToTemp: tx1, txReturn: tx2, tempFinalUsdc: Number(tmpBal) / 1e6, sourceFinalUsdc: Number(srcBal1) / 1e6, fundsReturned: ok }, null, 2));
}

main().catch((e) => { console.error("FAILED:", e.message?.slice(0, 300)); process.exit(1); });
