/**
 * Poll Base Mainnet USDC for the disposable buyer; auto-run canary pay when funded.
 * Usage: node scripts/poll-base-mainnet-buyer.mjs
 */
import { spawn } from "node:child_process";
import { createPublicClient, formatUnits, getAddress, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BUYER = getAddress(
  privateKeyToAccount(
    readFileSync(resolve(".env.base-mainnet-buyer.local"), "utf8")
      .trim()
      .split("=", 2)[1],
  ).address,
);
const USDC = getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const MIN_MICRO = 1000n;
const POLL_SECONDS = 15;
const MAX_POLLS = 240;

const client = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});
const abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
];

async function usdcMicroBalance() {
  return client.readContract({
    address: USDC,
    abi,
    functionName: "balanceOf",
    args: [BUYER],
  });
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function runPay() {
  return new Promise((resolvePay, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "base-mainnet:buyer", "--", "pay"],
      {
        cwd: resolve("."),
        env: process.env,
        stdio: "inherit",
        shell: true,
      },
    );
    child.on("exit", (code) => {
      if (code === 0) resolvePay(undefined);
      else reject(new Error(`base-mainnet:buyer pay exited with code ${code}`));
    });
  });
}

console.log(JSON.stringify({ buyer: BUYER, pollSeconds: POLL_SECONDS, maxPolls: MAX_POLLS }));

for (let i = 0; i < MAX_POLLS; i += 1) {
  const [eth, usdc] = await Promise.all([
    client.getBalance({ address: BUYER }),
    usdcMicroBalance(),
  ]);
  console.log(
    JSON.stringify({
      poll: i,
      eth: formatUnits(eth, 18),
      usdc: formatUnits(usdc, 6),
      micro: usdc.toString(),
    }),
  );
  if (usdc >= MIN_MICRO) {
    console.log("FUNDED — running canary pay…");
    await runPay();
    process.exit(0);
  }
  await sleep(POLL_SECONDS * 1000);
}

console.error("Timed out waiting for buyer funding.");
process.exit(1);
