const baseUrl = (process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app").replace(/\/$/, "");
const timeoutMs = Number(process.env.MONITOR_TIMEOUT_MS ?? "10000");

async function read(path) {
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "user-agent": "LedgerGuard-Platform-Monitor/1.0" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${path}: expected JSON, received HTTP ${response.status}`);
  }
  return { path, status: response.status, latencyMs: Date.now() - startedAt, body };
}

const results = [];
for (const path of [
  "/health",
  "/ready",
  "/v1/meta",
  "/v1/networks",
  "/v1/extensions",
  "/v1/extensions/health",
  "/schemas/extension-manifest-v1.json",
  "/schemas/control-intent-v2.json",
]) {
  results.push(await read(path));
}

const byPath = Object.fromEntries(results.map((result) => [result.path, result]));
for (const result of results) {
  if (result.status !== 200) throw new Error(`${result.path}: HTTP ${result.status}`);
}
if (byPath["/health"].body.ok !== true) throw new Error("/health: process unhealthy");
if (byPath["/ready"].body.ok !== true) throw new Error("/ready: not ready");
if (byPath["/ready"].body.chainId !== 5042002) throw new Error("/ready: Arc Testnet chain mismatch");
if (byPath["/ready"].body.extensionRegistry?.status !== "ready") {
  throw new Error("/ready: extension registry not included in readiness");
}
if (byPath["/v1/meta"].body.mainnet !== "disabled") {
  throw new Error("/v1/meta: real-funds mainnet must remain disabled");
}
if (byPath["/v1/extensions/health"].body.ok !== true) {
  throw new Error("/v1/extensions/health: registry invalid");
}
const entries = byPath["/v1/extensions"].body.entries;
if (!Array.isArray(entries) || entries.length < 1) throw new Error("/v1/extensions: empty registry");
const activeEntries = entries.filter((entry) => entry.state === "active");
if (activeEntries.length < 1) throw new Error("/v1/extensions: no active extension entries");
const registryWarnings = entries
  .filter((entry) => entry.state !== "active")
  .map((entry) => ({ id: entry.manifest?.id, state: entry.state }));
const expiryWarningWindowMs = 30 * 24 * 60 * 60 * 1000;
for (const entry of activeEntries) {
  const expiresAt = Date.parse(entry.manifest?.lifecycle?.expiresAt ?? "");
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() <= expiryWarningWindowMs) {
    registryWarnings.push({ id: entry.manifest?.id, state: "expires-within-30-days" });
  }
}
if (byPath["/schemas/extension-manifest-v1.json"].body.title !== "LedgerGuard Extension Manifest v1") {
  throw new Error("/schemas/extension-manifest-v1.json: wrong schema");
}
if (byPath["/schemas/control-intent-v2.json"].body.title !== "LedgerGuard Control Intent v2") {
  throw new Error("/schemas/control-intent-v2.json: wrong schema");
}

console.log(
  JSON.stringify({
    ok: true,
    baseUrl,
    checkedAt: new Date().toISOString(),
    mainnet: "disabled",
    registryEntries: entries.length,
    activeRegistryEntries: activeEntries.length,
    registryWarnings,
    endpoints: results.map(({ path, status, latencyMs }) => ({ path, status, latencyMs })),
  }),
);
