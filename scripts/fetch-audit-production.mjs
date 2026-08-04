/** Production fetch audit - no Playwright required. */
const base = "https://ledgerguard-gules.vercel.app";

const pages = [
  ["/", "LedgerGuard | Payment intent safety"],
  ["/guard/create", "Create a payment link"],
  ["/pay", "Pay with USDC"],
  ["/docs", "API documentation"],
  ["/developer", "Developer Console"],
  ["/status", "LIVE STATUS"],
  ["/payments", "Check whether a payment arrived"],
  ["/testnet-help", "Set up your wallet"],
  ["/test", "Complete the test flow"],
  ["/pilot", "LedgerGuard | Design partner pilot"],
  ["/about", "What we build"],
  ["/privacy", "Privacy Policy"],
  ["/terms", "Terms of Service"],
  ["/canary", "canary"],
  ["/openapi.json", "openapi"],
  ["/health", "ok"],
  ["/ready", "ready"],
  ["/v1/meta", "ledgerguard"],
];

const apis = [
  ["GET", "/health"],
  ["GET", "/ready"],
  ["GET", "/v1/meta"],
  ["GET", "/v1/networks"],
  ["GET", "/openapi.json"],
];

const githubSpecs = [
  "https://github.com/lw22336599-rgb/ledgerguard/blob/main/docs/PREFLIGHT_RECORD_MAPPING.md",
  "https://github.com/lw22336599-rgb/ledgerguard/blob/main/docs/OPEN_SOURCE_POLICY.md",
];

const report = { at: new Date().toISOString(), pages: [], apis: [], githubSpecs: [], issues: [] };

for (const [path, marker] of pages) {
  try {
    const res = await fetch(base + path, { redirect: "follow", signal: AbortSignal.timeout(30000) });
    const body = await res.text();
    const statusMarker = ["canary", "openapi", "ok", "ready", "ledgerguard"].includes(marker);
    const hasMarker = statusMarker ? res.ok || res.status === 402 || res.status === 503 : body.includes(marker);
    const expectedStatus = path === "/canary" ? res.status === 503 : res.ok;
    report.pages.push({ path, status: res.status, hasMarker, ok: expectedStatus && hasMarker });
    if (!hasMarker && res.ok) report.issues.push(`Page ${path}: missing marker "${marker}"`);
    if (!expectedStatus) report.issues.push(`Page ${path}: unexpected HTTP ${res.status}`);
  } catch (error) {
    report.pages.push({ path, error: String(error) });
    report.issues.push(`Page ${path}: ${error}`);
  }
}

for (const [, path] of apis) {
  try {
    const res = await fetch(base + path, { signal: AbortSignal.timeout(30000) });
    report.apis.push({ path, status: res.status, ok: res.ok });
    if (!res.ok) report.issues.push(`API ${path}: HTTP ${res.status}`);
  } catch (error) {
    report.issues.push(`API ${path}: ${error}`);
  }
}

for (const url of githubSpecs) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30000) });
    report.githubSpecs.push({ url, status: res.status, ok: res.ok });
    if (!res.ok) report.issues.push(`GitHub spec 404: ${url}`);
  } catch (error) {
    report.issues.push(`GitHub spec: ${error}`);
  }
}

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.issues.length === 0 ? 0 : 1;
