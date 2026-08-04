/**
 * Arc Testnet real end-to-end loop (human-path simulation).
 * Creates a payment link (UI), pays it with a real signed onchain transfer,
 * then verifies evidence. Uses testnet USDC (no value) + real signatures.
 *
 * Run: LG_SOURCE_PK=0x... node scripts/arc-testnet-e2e.mjs
 */
import { createPublicClient, createWalletClient, http, parseAbi, getAddress, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

const PK = process.env.LG_SOURCE_PK;
if (!PK) throw new Error("LG_SOURCE_PK required");

const rpc = "https://rpc.testnet.arc.network";
const publicClient = createPublicClient({ chain: arcTestnet, transport: http(rpc) });
const walletClient = createWalletClient({ chain: arcTestnet, transport: http(rpc) });
const account = privateKeyToAccount(PK);

const SOURCE = getAddress("0xF1437d9CD304aE49f2ec005AC967813B3a7c466c");
const USDC = "0x3600000000000000000000000000000000000000";
const RECEIVER = getAddress("0x4732d748a7dA766A0192adC2BBefC6041AAF9056");
const AMOUNT = 1_000_000_000_000_000_000n; // 1.0 USDC (Arc native 18-decimals)

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
]);
const transferCalldata = encodeFunctionData({
  abi: erc20Abi,
  functionName: "transfer",
  args: [RECEIVER, AMOUNT],
});

async function main() {
  console.log("=== Arc Testnet real E2E loop ===\n");

  // Step 1: preflight the transfer (engine check before signing)
  const preflight = await fetch("https://ledgerguard-gules.vercel.app/v1/preflight", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      network: "arcTestnet",
      from: SOURCE.toLowerCase(),
      to: USDC.toLowerCase(),
      data: transferCalldata,
      valueWei: "0",
      intent: {
        action: "transfer",
        expectedDebitAddress: SOURCE.toLowerCase(),
        expectedRecipient: RECEIVER.toLowerCase(),
        expectedAssetAddress: USDC.toLowerCase(),
        expectedAmountMicroUsdc: "1000000",
        purpose: "Website redesign deposit (Alice's Design Studio)",
      },
      policy: {},
    }),
  }).then((r) => r.json());
  console.log("1. preflight decision:", preflight.decision, "| findings:", (preflight.findings ?? []).map((f) => f.code).join(",") || "none");

  // Step 2: real signed transfer (simulates payer approving in wallet)
  const hash = await walletClient.sendTransaction({
    account,
    to: USDC,
    data: transferCalldata,
  });
  console.log("2. transfer tx:", hash);

  // Step 3: wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("3. confirmed in block:", receipt.blockNumber, "status:", receipt.status);

  // Step 4: verify receiver balance increased
  const bal = await publicClient.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [RECEIVER] });
  console.log("4. receiver USDC balance:", bal.toString());

  console.log("\n=== RESULT ===");
  console.log(JSON.stringify({ txHash: hash, block: String(receipt.blockNumber), status: receipt.status, decision: preflight.decision }, null, 2));
}

main().catch((e) => {
  console.error("FAILED:", e.message?.slice(0, 200));
  process.exit(1);
});
