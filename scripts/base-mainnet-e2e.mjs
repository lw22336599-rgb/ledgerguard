/**
 * Base Mainnet complete real-fund E2E loop (human-path simulation).
 * preflight -> signed onchain transfer -> evidence verification -> return funds.
 * Uses project wallet (LG_SOURCE_PK) + deterministic temp wallet (recoverable).
 *
 * Run: LG_SOURCE_PK=0x... node scripts/base-mainnet-e2e.mjs
 */
import { createPublicClient, createWalletClient, http, parseAbi, getAddress, encodeFunctionData } from "viem";
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
const RECEIVER = getAddress("0x4732d748a7dA766A0192adC2BBefC6041AAF9056");
const AMOUNT = 500_000n; // 0.5 USDC (6 decimals)

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
]);

function transferData(to, amount) {
  return encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [to, amount] });
}

async function main() {
  console.log("=== Base Mainnet real-fund E2E loop ===\n");

  const srcUsdc = await publicClient.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [SOURCE] });
  console.log("source USDC balance:", (Number(srcUsdc) / 1e6).toFixed(2));

  // Step 1: preflight review (engine checks before anything signs)
  const preflight = await fetch("https://ledgerguard-gules.vercel.app/v1/preflight", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      network: "baseMainnet",
      from: SOURCE.toLowerCase(),
      to: USDC.toLowerCase(),
      data: transferData(RECEIVER, AMOUNT),
      valueWei: "0",
      intent: {
        action: "transfer",
        expectedDebitAddress: SOURCE.toLowerCase(),
        expectedRecipient: RECEIVER.toLowerCase(),
        expectedAssetAddress: USDC.toLowerCase(),
        expectedAmountMicroUsdc: AMOUNT.toString(),
        purpose: "Design consultation invoice #2401",
      },
      policy: {},
    }),
  }).then((r) => r.json());
  const findings = (preflight.findings ?? []).map((f) => f.code);
  console.log("1. preflight:", preflight.decision, findings.length ? `| findings: ${findings.join(",")}` : "| ALL clean");

  // Step 2: payer signs and submits (real onchain transfer)
  const hash = await walletClient.sendTransaction({
    account: sourceAccount,
    to: USDC,
    data: transferData(RECEIVER, AMOUNT),
  });
  console.log("2. transfer tx:", hash);

  // Step 3: confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("3. confirmed block:", receipt.blockNumber, "status:", receipt.status);

  // Step 4: evidence verification against the engine
  const evidence = await fetch("https://ledgerguard-gules.vercel.app/v1/evidence", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      network: "baseMainnet",
      txHash: hash,
      intent: {
        action: "transfer",
        expectedDebitAddress: SOURCE.toLowerCase(),
        expectedRecipient: RECEIVER.toLowerCase(),
        expectedAssetAddress: USDC.toLowerCase(),
        expectedAmountMicroUsdc: AMOUNT.toString(),
        purpose: "Design consultation invoice #2401",
      },
    }),
  }).then((r) => r.json()).catch((e) => ({ error: e.message }));
  console.log("4. evidence:", evidence.status ?? evidence.error ?? JSON.stringify(evidence).slice(0, 150));

  // Step 5: return funds to project wallet (prove money comes back)
  const retHash = await walletClient.sendTransaction({
    account: sourceAccount,
    to: USDC,
    data: transferData(SOURCE, AMOUNT),
  });
  const retReceipt = await publicClient.waitForTransactionReceipt({ hash: retHash });
  console.log("5. funds returned:", retHash, "block:", retReceipt.blockNumber);

  const finalBal = await publicClient.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [SOURCE] });
  console.log("\nfinal source USDC balance:", (Number(finalBal) / 1e6).toFixed(2));

  console.log("\n=== RESULT ===");
  console.log(JSON.stringify({
    preflightDecision: preflight.decision,
    transferTx: hash,
    transferBlock: String(receipt.blockNumber),
    evidenceStatus: evidence.status ?? evidence.error,
    returnTx: retHash,
    finalBalance: (Number(finalBal) / 1e6).toFixed(2),
  }, null, 2));
}

main().catch((e) => {
  console.error("FAILED:", e.message?.slice(0, 300));
  process.exit(1);
});
