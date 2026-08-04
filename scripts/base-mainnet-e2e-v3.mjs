/**
 * Read-only verifier for the recorded Base Mainnet project-party self-test.
 *
 * This script intentionally cannot sign, fund, transfer, or reconstruct a
 * wallet key. The original test helper derived a temporary key from public
 * inputs; once committed, that address became permanently unsafe for custody.
 * Never send assets to the recorded temporary address.
 *
 * Run: node scripts/base-mainnet-e2e-v3.mjs
 */
import { createPublicClient, formatEther, http, parseAbi } from "viem";
import { base } from "viem/chains";

const rpc = process.env.BASE_MAINNET_RPC_URL ?? "https://mainnet.base.org";
const client = createPublicClient({ chain: base, transport: http(rpc) });

const SOURCE = "0xF1437d9CD304aE49f2ec005AC967813B3a7c466c";
const COMPROMISED_TEMP = "0xC940A0313955CcAD0d59BE41Af43bE53637CC4F5";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TRANSACTIONS = [
  "0x581e59ac5cbc73f2971eb8ad868e9fbf45f399123cd2dcce1298299dffa9c5c0",
  "0x00bc8432271964b80cc1f412bf2196fe585db0863f6a2a33b09a069b0aad0c11",
  "0x8fae98ffd0c8a899c71773f5df6ea9da39e2af35625e2bbb170496dfe7476f73",
  "0x934216d18e73139d8fbd95e416d859ca5477c7e85d1673b2608f2e65265f83d0",
];
const erc20Abi = parseAbi(["function balanceOf(address) view returns (uint256)"]);

const receipts = await Promise.all(
  TRANSACTIONS.map((hash) => client.getTransactionReceipt({ hash })),
);
const [sourceUsdc, tempUsdc, tempEth] = await Promise.all([
  client.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [SOURCE] }),
  client.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [COMPROMISED_TEMP] }),
  client.getBalance({ address: COMPROMISED_TEMP }),
]);

const result = {
  nature: "read-only project-party verification; not a customer payment or x402 settlement",
  transactions: receipts.map((receipt) => ({ hash: receipt.transactionHash, status: receipt.status })),
  sourceUsdc: Number(sourceUsdc) / 1e6,
  compromisedTempUsdc: Number(tempUsdc) / 1e6,
  compromisedTempEth: formatEther(tempEth),
  warning: "The temporary address is publicly reconstructible in git history and must never receive assets.",
};

if (receipts.some((receipt) => receipt.status !== "success")) {
  throw new Error(`One or more recorded transactions failed: ${JSON.stringify(result)}`);
}

console.log(JSON.stringify(result, null, 2));
