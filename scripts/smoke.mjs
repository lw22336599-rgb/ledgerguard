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
const homeHtml = await home.text();
if (
  home.status !== 200 ||
  !homeHtml.includes("Send a USDC payment link.") ||
  !homeHtml.includes("https://x.com/HuiLibaa") ||
  !homeHtml.includes('<html lang="en">')
) {
  throw new Error("/: public demo is unavailable");
}
if (!home.headers.get("content-security-policy")?.includes("default-src 'self'")) {
  throw new Error("/: strict Content-Security-Policy is missing");
}

for (const [path, marker] of [
  ["/docs", "API documentation"],
  ["/catalog", "SERVICE CATALOG"],
  ["/test", "Complete the test flow end to end"],
  ["/status", "LIVE STATUS"],
  ["/developer", "Developer Console"],
  ["/guard/create", "Create a USDC payment link."],
  ["/routes", "route-readiness"],
  ["/docs/integration", "INTEGRATION SAFETY BOUNDARY"],
]) {
  const response = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(20_000),
  });
  const html = await response.text();
  if (
    response.status !== 200 ||
    !html.includes(marker) ||
    !html.includes('<html lang="en">') ||
    !html.includes('class="portal-nav"') ||
    !html.includes("/site-nav.js") ||
    /\p{Script=Han}/u.test(html)
  ) {
    throw new Error(`${path}: human-readable page is unavailable`);
  }
}

const openapi = await fetch(`${baseUrl}/openapi.json`, {
  signal: AbortSignal.timeout(20_000),
});
if (
  openapi.status !== 200 ||
  !openapi.headers.get("content-type")?.includes("application/json") ||
  (await openapi.json()).openapi !== "3.1.0"
) {
  throw new Error("/openapi.json: machine-readable API document is invalid");
}

const { response: healthResponse, body: health } = await request("/health");
if (!health.ok) throw new Error("/health: ok was not true");
if (!healthResponse.headers.get("cache-control")?.includes("no-store")) {
  throw new Error("/health: cache-control must include no-store");
}

const { body: ready } = await request("/ready");
if (!ready.ok || ready.chainId !== 5042002) {
  throw new Error(`/ready: expected Arc Testnet chain 5042002, got ${JSON.stringify(ready)}`);
}

const { body: networks } = await request("/v1/networks");
const mainnet = networks.networks.find((network) => network.name === "arcMainnet");
if (!mainnet || mainnet.enabled !== false) {
  throw new Error("/v1/networks: Arc Mainnet safety gate is not closed");
}

const guard = await fetch(
  `${baseUrl}/guard?recipient=0x2222222222222222222222222222222222222222&amount=1.00&limit=2.00&purpose=Release%20smoke`,
  { signal: AbortSignal.timeout(20_000) },
);
const guardHtml = await guard.text();
if (
  guard.status !== 200 ||
  !guardHtml.includes("Payment request") ||
  !guardHtml.includes("Release smoke") ||
  !guardHtml.includes("REVIEW")
) {
  throw new Error("/guard: prefilled human receipt is unavailable");
}

const createdGuard = await fetch(`${baseUrl}/v1/guard-links`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    issuer: "Release smoke",
    recipient,
    amount: "1.00",
    limit: "1.00",
    purpose: "Release acceptance",
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }),
  signal: AbortSignal.timeout(20_000),
});
const createdGuardBody = await createdGuard.json();
if (
  createdGuard.status !== 201 ||
  !createdGuardBody.url?.includes("/guard?") ||
  !/^[0-9a-f]{20}$/.test(createdGuardBody.intentId ?? "")
) {
  throw new Error(
    `/v1/guard-links: validated link creation failed ${JSON.stringify(createdGuardBody)}`,
  );
}

const { body: adapters } = await request("/v1/adapters");
if (
  !adapters.adapters?.some(
    (adapter) =>
      adapter.id === "ap2-mandate" &&
      adapter.status === "interface-only" &&
      adapter.enabled === false,
  )
) {
  throw new Error("/v1/adapters: truthful protocol boundary is missing");
}

const { body: meta } = await request("/v1/meta");
if (meta.developerConsole !== "/developer") {
  throw new Error("/v1/meta: developer console discovery is missing");
}
if (
  process.env.EXPECT_DEVELOPER_SELF_SERVICE === "true" &&
  (meta.tenantApi !== "enabled" || ready.developerSelfService !== "ready")
) {
  throw new Error(
    `/v1/meta: developer self-service is not durably ready ${JSON.stringify({ meta, ready })}`,
  );
}
const shadow = networks.shadows?.find(
  (entry) => entry.name === "arcMainnet5042",
);
if (
  !shadow ||
  shadow.realFundsEnabled !== false ||
  shadow.signingEnabled !== false ||
  shadow.x402MainnetEnabled !== false
) {
  throw new Error("/v1/networks: Arc 5042 shadow safety flags are invalid");
}

let shadowState = "5042 shadow disabled";
if (process.env.EXPECT_ARC_MAINNET_SHADOW === "true") {
  const { body: shadowStatus } = await request("/v1/shadow/arc-mainnet");
  if (
    !shadowStatus.ok ||
    shadowStatus.chainId !== 5042 ||
    shadowStatus.mode !== "read-only-shadow" ||
    shadowStatus.realFundsEnabled !== false ||
    shadowStatus.signingEnabled !== false ||
    shadowStatus.x402MainnetEnabled !== false ||
    shadowStatus.healthyRpcs < 1 ||
    shadowStatus.healthyObservers < 1 ||
    !shadowStatus.contractsConsistent
  ) {
    throw new Error(
      `/v1/shadow/arc-mainnet: invalid status ${JSON.stringify(shadowStatus)}`,
    );
  }
  shadowState = `5042 shadow ${shadowStatus.healthyRpcs} RPC + ${shadowStatus.healthyObservers} observer`;
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
if (
  preflight.decision !== "REVIEW" ||
  !preflight.findings?.some((finding) => finding.code === "SIMULATION_REQUIRED")
) {
  throw new Error(
    `/v1/preflight: expected REVIEW with SIMULATION_REQUIRED, got ${JSON.stringify(preflight)}`,
  );
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
    challenge.accepts?.[0]?.network !== "eip155:5042002" ||
    challenge.resource?.url !== `${baseUrl}/v1/paid/network-risk`
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

console.log(
  `PASS ${baseUrl} | Arc ${ready.chainId} block ${ready.blockNumber} | preflight REVIEW (simulation required) | mainnet closed | ${shadowState} | ${paymentState}`,
);
