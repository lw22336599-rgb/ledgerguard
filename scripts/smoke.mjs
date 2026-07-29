const baseUrl = (process.env.LEDGERGUARD_URL ?? "http://localhost:3000").replace(/\/$/, "");
const recipient = "0x2222222222222222222222222222222222222222";
const usdc = "0x3600000000000000000000000000000000000000";
const amount = "1000000";
const calldata =
  "0xa9059cbb" +
  recipient.slice(2).padStart(64, "0") +
  BigInt(amount).toString(16).padStart(64, "0");

async function request(path, options, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(20_000),
    ...options,
  });
  const text = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${path}: expected ${expectedStatus}, got ${response.status}: ${text.slice(0, 300)}`);
  }
  return { response, body: text ? JSON.parse(text) : null };
}

const home = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(20_000) });
if (home.status !== 200 || !(await home.text()).includes("Let agents pay.")) {
  throw new Error("/: public demo is unavailable");
}

const { body: health } = await request("/health");
if (!health.ok) throw new Error("/health: ok was not true");

const { body: ready } = await request("/ready");
if (!ready.ok || ready.chainId !== 5042002) {
  throw new Error(`/ready: expected Arc Testnet chain 5042002, got ${JSON.stringify(ready)}`);
}

const { body: networks } = await request("/v1/networks");
const mainnet = networks.networks.find((network) => network.name === "arcMainnet");
if (!mainnet || mainnet.enabled !== false) {
  throw new Error("/v1/networks: Arc Mainnet safety gate is not closed");
}

const { body: preflight } = await request("/v1/preflight", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    network: "arcTestnet",
    to: usdc,
    data: calldata,
    valueWei: "0",
    intent: {
      action: "transfer",
      expectedRecipient: recipient,
      expectedAssetAddress: usdc,
      expectedAmountMicroUsdc: amount,
      purpose: "Production smoke test",
    },
    policy: { requireSimulation: false, maxAmountMicroUsdc: amount },
  }),
});
if (preflight.decision !== "ALLOW") {
  throw new Error(`/v1/preflight: expected ALLOW, got ${JSON.stringify(preflight)}`);
}

const paidResponse = await fetch(`${baseUrl}/v1/paid/network-risk`, {
  signal: AbortSignal.timeout(20_000),
});
const paid = await paidResponse.json();
let paymentState;
if (paidResponse.status === 402) {
  const encoded = paidResponse.headers.get("payment-required");
  if (!encoded) throw new Error("/v1/paid/network-risk: missing PAYMENT-REQUIRED header");
  const challenge = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  if (
    challenge.x402Version !== 2 ||
    challenge.accepts?.[0]?.network !== "eip155:5042002"
  ) {
    throw new Error(`/v1/paid/network-risk: invalid challenge ${JSON.stringify(challenge)}`);
  }
  paymentState = `x402 challenge ${paid.priceMicroUsdc} micro-USDC`;
} else if (paidResponse.status === 503 && paid.error === "X402_DISABLED") {
  paymentState = "x402 safely disabled";
} else {
  throw new Error(
    `/v1/paid/network-risk: unexpected state ${paidResponse.status} ${JSON.stringify(paid)}`,
  );
}

console.log(`PASS ${baseUrl} | Arc ${ready.chainId} block ${ready.blockNumber} | preflight ALLOW | mainnet closed | ${paymentState}`);
