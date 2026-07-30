const pageHead = (title: string, description: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
  <script defer src="/_vercel/insights/script.js"></script>
</head>`;

const footer = `<footer>Arc Testnet software · Mainnet stays disabled until official parameters are verified and a human release approval is recorded. Contact: <a href="mailto:lw22336599@gmail.com">Email</a> · <a href="/test">Join testing</a> · <a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">GitHub</a></footer>`;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export function guardLinkHtml(input: {
  payer: string;
  recipient: string;
  amount: string;
  limit: string;
  purpose: string;
  validUntil?: string;
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  findings: Array<{ code: string; message: string }>;
  requestId: string;
}): string {
  const fields: Array<[string, string]> = [
    ["Initiated by", input.payer],
    ["Pay to", input.recipient],
    ["Amount", `${input.amount} USDC`],
    ["Purpose", input.purpose],
    ["Maximum allowed", `${input.limit} USDC`],
    ["Valid until", input.validUntil ?? "Not declared"],
    ["Network", "Arc Testnet"],
  ];
  return `${pageHead(
    "LedgerGuard | Payment Intent Receipt",
    "A prefilled, human-readable Arc Testnet payment intent and deterministic safety decision.",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">PREFILLED GUARD LINK</span></nav>
    <section class="subhero">
      <p class="eyebrow">NO WALLET CONNECTION &middot; NO SIGNATURE</p>
      <h1 class="compact">Payment intent receipt</h1>
      <p class="lead">Review the declared payment before any wallet signs. Technical details remain available as evidence.</p>
    </section>
    <section class="panel">
      <div>
        <p class="step">DECLARED INTENT</p>
        <dl>${fields.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl>
      </div>
      <section class="result ${input.decision.toLowerCase()}">
        <strong>${escapeHtml(input.decision)}</strong>
        <p>${input.decision === "ALLOW" ? "All implemented checks passed." : input.decision === "BLOCK" ? "A defined policy risk was detected." : "Review is required before signing."}</p>
        <details><summary>View evidence</summary>
          <ul>${input.findings.map((finding) => `<li><strong>${escapeHtml(finding.code)}</strong>: ${escapeHtml(finding.message)}</li>`).join("")}</ul>
          <p>Request ID: <code>${escapeHtml(input.requestId)}</code></p>
        </details>
      </section>
    </section>
    <section class="notice"><strong>Testnet only:</strong> This receipt does not sign, submit, or settle a transaction. Arc Testnet assets have no financial value.</section>
    <div class="links bottom-links"><a href="/">Open checker</a><a href="/docs">Developer docs</a><a href="/test">Join testing</a></div>
    ${footer}
  </main>
</body>
</html>`;
}

export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="LedgerGuard">
  <rect width="64" height="64" rx="16" fill="#06140f"/>
  <path d="M32 10 51 18v13c0 12-7.5 20.5-19 24-11.5-3.5-19-12-19-24V18l19-8Z" fill="#7df2bd"/>
  <path d="M32 18v28c7.2-3 11-8.2 11-15.5v-7L32 18Z" fill="#06140f"/>
</svg>`;

export const demoHtml = `${pageHead(
  "LedgerGuard | Arc Payment Safety Check",
  "LedgerGuard checks Arc USDC payment intent before signing without accessing private keys or signing for users.",
)}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">ARC TESTNET</span></nav>
    <section class="hero">
      <p class="eyebrow">NON-CUSTODIAL PAYMENT FIREWALL</p>
      <h1>Let agents pay.<br><span>Let rules protect funds.</span></h1>
      <p class="lead">Check Arc USDC recipients, amounts, assets, and policy before a wallet signs. Enter public addresses only. Never enter a private key or recovery phrase.</p>
      <div class="links"><a href="/test">Join testing</a><a href="/developer">Developer console</a><a href="/docs">Developer docs</a><a href="/catalog">Service catalog</a><a href="/status">Live status</a><a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">Source code</a></div>
    </section>
    <section class="notice" role="note"><strong>Testnet notice:</strong> This page uses Arc test assets with no financial value. LedgerGuard does not connect a wallet, initiate a transaction, or request a signature.</section>
    <section class="panel">
      <div>
        <p class="step">PUBLIC LIVE DEMO</p>
        <h2>Check a USDC payment intent</h2>
        <p class="muted">Without a payer address, the demo performs policy checks and returns REVIEW. Adding a public payer address enables read-only simulation and may produce ALLOW. ALLOW means only that the implemented checks passed; it is not a guarantee of safety or profit.</p>
      </div>
      <form id="preflight">
        <label>Recipient public address<input id="recipient" value="0x2222222222222222222222222222222222222222" required pattern="0x[0-9a-fA-F]{40}" autocomplete="off"></label>
        <label>Amount (USDC)<input id="amount" value="1.00" required inputmode="decimal" pattern="\\d+(\\.\\d{1,6})?" autocomplete="off"></label>
        <label>Per-transaction policy limit (USDC)<input id="limit" value="10.00" required inputmode="decimal" pattern="\\d+(\\.\\d{1,6})?" autocomplete="off"></label>
        <label>Payer public address (optional)<input id="payer" placeholder="0x… (never enter a private key)" pattern="0x[0-9a-fA-F]{40}" autocomplete="off"></label>
        <button type="submit">Run preflight</button>
      </form>
      <section id="result" class="result neutral" aria-live="polite" aria-atomic="true">
        <strong id="result-title">Ready to check</strong>
        <p id="result-summary">No wallet connection is required and no transaction will be sent.</p>
        <ul id="result-findings"></ul>
        <details id="result-details" hidden><summary>View technical details</summary><pre id="result-json"></pre></details>
      </section>
    </section>
    <section class="grid">
      <article><span>01</span><h3>Declare intent</h3><p>Specify the payer, recipient, asset, amount, and spending limit.</p></article>
      <article><span>02</span><h3>Simulate read-only</h3><p>Simulate through Arc RPC without holding keys or signing.</p></article>
      <article><span>03</span><h3>Reconcile onchain</h3><p>After settlement, match actual asset flows against the original intent.</p></article>
    </section>
    ${footer}
  </main>
  <script src="/app.js" defer></script>
</body>
</html>`;

export const developerDocsHtml = `${pageHead(
  "LedgerGuard | Developer Documentation",
  "Human-readable documentation for the LedgerGuard API.",
)}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">DEVELOPER DOCS</span></nav>
    <section class="subhero">
      <p class="eyebrow">HUMAN-READABLE DEVELOPER ENTRY</p>
      <h1 class="compact">API documentation</h1>
      <p class="lead">This page is designed for people. The <a href="/openapi.json">raw OpenAPI JSON</a> is a machine-readable file for programs, SDKs, and AI agents. Seeing compact JSON when opening it directly is expected.</p>
    </section>
    <section class="docs-grid">
      <article class="doc-card"><span>POST</span><h2>/v1/preflight</h2><p>Parse, compare, and simulate an unsigned transaction before signing. Returns ALLOW, REVIEW, or BLOCK.</p></article>
      <article class="doc-card"><span>POST</span><h2>/v1/evidence</h2><p>After confirmation, reconcile payer, recipient, asset, amount, and unexpected side effects.</p></article>
      <article class="doc-card"><span>GET + x402</span><h2>/v1/paid/network-risk</h2><p>A paid Arc Testnet resource. Returns a standard HTTP 402 challenge until payment is settled.</p></article>
    </section>
    <section class="code-card">
      <h2>Minimal request example</h2>
      <pre>curl -X POST https://ledgerguard-gules.vercel.app/v1/preflight \\
  -H "content-type: application/json" \\
  -d '{
    "network": "arcTestnet",
    "from": "0x1111111111111111111111111111111111111111",
    "to": "0x3600000000000000000000000000000000000000",
    "data": "0xa9059cbb...",
    "valueWei": "0",
    "intent": {
      "action": "transfer",
      "expectedDebitAddress": "0x1111111111111111111111111111111111111111",
      "expectedRecipient": "0x2222222222222222222222222222222222222222",
      "expectedAssetAddress": "0x3600000000000000000000000000000000000000",
      "expectedAmountMicroUsdc": "1000000",
      "purpose": "Invoice 42"
    },
    "policy": {
      "maxAmountMicroUsdc": "2000000",
      "requireSimulation": true
    }
  }'</pre>
    </section>
    <section class="notice"><strong>Decision boundary:</strong> ALLOW is returned only when every implemented rule passes and read-only simulation succeeds. Unknown calls, an undeclared payer, or missing simulation are never treated as safe to sign.</section>
    <div class="links bottom-links"><a href="/developer">Developer console</a><a href="/openapi.json">Raw OpenAPI</a><a href="/.well-known/ledgerguard.json">Raw agent catalog</a><a href="/v1/networks">Raw network registry</a><a href="/docs/integration">Integration boundary</a></div>
    ${footer}
  </main>
</body>
</html>`;

export function catalogHtml(
  priceMicroUsdc: string,
  sellerAddress?: string | null,
): string {
  return `${pageHead(
    "LedgerGuard | Service Catalog",
    "LedgerGuard service entry points for people, developers, and AI agents.",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">SERVICE CATALOG</span></nav>
    <section class="subhero">
      <p class="eyebrow">SERVICE CATALOG</p>
      <h1 class="compact">Three entry points. One safety core.</h1>
      <p class="lead">People use the web checker, developers call the API, and AI agents read the machine catalog and purchase resources through x402.</p>
    </section>
    <section class="docs-grid">
      <article class="doc-card"><span>FREE</span><h2>Guard Link</h2><p>Open a prefilled payment intent without connecting a wallet. Designed to make transaction risk understandable.</p><a href="/guard?recipient=0x2222222222222222222222222222222222222222&amp;amount=1.00&amp;limit=2.00&amp;purpose=Example%20invoice">Open sample receipt</a></article>
      <article class="doc-card"><span>FREE API</span><h2>Preflight + Evidence</h2><p>Pre-signing checks and post-settlement reconciliation for wallets, agents, and payment applications.</p><a href="/docs">Read the docs</a></article>
      <article class="doc-card"><span>X402 TESTNET</span><h2>Network Risk</h2><p>Currently priced at ${priceMicroUsdc} micro-USDC in test assets to validate automated discovery, payment, and delivery.</p><a href="/.well-known/ledgerguard.json">Machine catalog</a></article>
    </section>
    <section class="notice"><strong>Commercial status:</strong> The testnet payment flow has been technically validated, but test assets have no financial value. LedgerGuard does not currently claim paying customers, recurring revenue, or a mainnet SLA.${sellerAddress ? ` Public test recipient: <code>${sellerAddress}</code>.` : ""}</section>
    ${footer}
  </main>
</body>
</html>`;
}

export function testerHtml(
  priceMicroUsdc: string,
  sellerAddress?: string | null,
): string {
  return `${pageHead(
    "LedgerGuard | Arc Testnet Experience",
    "Test the LedgerGuard web app, API, and x402 payment flow without providing a private key.",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">PUBLIC TEST</span></nav>
    <section class="subhero">
      <p class="eyebrow">PUBLIC TEST ENTRY · TESTNET ONLY</p>
      <h1 class="compact">Complete the test flow end to end</h1>
      <p class="lead">Anyone can try the free checker, developers can copy an API request, and a wallet holding Arc test assets can validate x402 payment, settlement, and resource delivery. The entire flow uses test assets with no financial value.</p>
    </section>
    <section class="docs-grid">
      <article class="doc-card"><span>1 &middot; EVERYONE</span><h2>Prefilled payment receipt</h2><p>No wallet connection or manual policy entry is needed. Review who pays whom, how much, why, and the maximum allowed.</p><a href="/guard?recipient=0x2222222222222222222222222222222222222222&amp;amount=1.00&amp;limit=2.00&amp;purpose=Example%20invoice">Open sample Guard Link</a></article>
      <article class="doc-card"><span>2 · DEVELOPERS</span><h2>Use a metered API key</h2><p>Create a revocable test API key, call <code>POST /v1/developer/preflight</code>, and inspect the durable usage ledger. The free endpoint remains <code>POST /v1/preflight</code>.</p><a href="/developer">Open developer console</a></article>
      <article class="doc-card"><span>3 · X402</span><h2>Test automated payment</h2><p><code>GET /v1/paid/network-risk</code> returns a standard 402 challenge for ${priceMicroUsdc} micro-USDC. After a buyer script signs and settles, the resource and onchain receipt are delivered automatically.</p><a href="https://github.com/lw22336599-rgb/ledgerguard/blob/main/docs/X402_BUYER_RUNBOOK.md" rel="noreferrer">Payment test runbook</a></article>
    </section>
    <section class="notice"><strong>Completion evidence:</strong> Record the page result, the X-LedgerGuard-Request-Id response header, or a public Arc Testnet transaction hash. Never submit a private key, recovery phrase, API token, or personal financial information.</section>
    ${sellerAddress ? `<section class="notice"><strong>Testnet recipient:</strong> <code>${sellerAddress}</code>. It receives only Arc Testnet x402 settlements; the service never stores the wallet private key.</section>` : ""}
    <div class="links bottom-links"><a href="https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose" rel="noreferrer">Submit a test result or issue</a><a href="/status">View live status</a><a href="mailto:lw22336599@gmail.com">Email us</a></div>
    ${footer}
  </main>
</body>
</html>`;
}

export function developerConsoleHtml(input: {
  storageReady: boolean;
  registrationEnabled: boolean;
}): string {
  const available = input.storageReady && input.registrationEnabled;
  return `${pageHead(
    "LedgerGuard | Developer Console",
    "Create and manage a LedgerGuard Arc Testnet API key and inspect metered usage.",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge ${available ? "" : "danger"}">${available ? "TESTNET SELF-SERVICE" : "SETUP PENDING"}</span></nav>
    <section class="subhero">
      <p class="eyebrow">DEVELOPER SELF-SERVICE</p>
      <h1 class="compact">One key. Metered safety checks.</h1>
      <p class="lead">Create a revocable Arc Testnet API key, run a metered preflight, and inspect the durable usage ledger. Test access is free and has no financial value.</p>
    </section>
    <section class="notice"><strong>Key safety:</strong> The API key is displayed only when created or rotated. LedgerGuard stores only a SHA-256 digest. This browser keeps the key in session storage, which is cleared when the tab session ends.</section>
    <section class="panel developer-panel">
      <div>
        <p class="step">NEW TEST TENANT</p>
        <h2>Create an API key</h2>
        <form id="developer-register">
          <label>Project or developer name<input id="developer-name" required minlength="2" maxlength="80" pattern="[a-zA-Z0-9][a-zA-Z0-9 ._/@-]*" autocomplete="organization"></label>
          <button type="submit" ${available ? "" : "disabled"}>Create test API key</button>
        </form>
      </div>
      <div>
        <p class="step">EXISTING TENANT</p>
        <h2>Open your usage</h2>
        <form id="developer-login">
          <label>Test API key<input id="developer-key" type="password" required pattern="lg_test_[A-Za-z0-9_-]{32,80}" autocomplete="off" spellcheck="false"></label>
          <button type="submit" ${input.storageReady ? "" : "disabled"}>Load account</button>
        </form>
      </div>
      <section id="developer-result" class="result neutral" aria-live="polite" aria-atomic="true">
        <strong id="developer-title">${available ? "Ready" : "Shared storage is not configured"}</strong>
        <p id="developer-summary">${available ? "Create a key or enter an existing key to continue." : "Self-service fails closed until the durable store is connected."}</p>
        <div id="developer-actions" class="links" hidden>
          <button id="developer-run" type="button">Run metered preflight</button>
          <button id="developer-shadow" type="button" class="secondary">Run non-enforcing shadow</button>
          <button id="developer-rotate" type="button" class="secondary">Rotate API key</button>
          <button id="developer-copy" type="button" class="secondary">Copy current key</button>
        </div>
        <details id="developer-details" hidden><summary>View account and usage data</summary><pre id="developer-json"></pre></details>
      </section>
    </section>
    <section class="notice"><strong>Commercial boundary:</strong> This console proves tenant identity, key revocation, quota enforcement, and durable metering. It does not represent a paid subscription or mainnet service.</section>
    <div class="links bottom-links"><a href="/docs">API documentation</a><a href="/test">Public test flow</a><a href="/status">Live status</a></div>
    ${footer}
  </main>
  <script src="/developer.js" defer></script>
</body>
</html>`;
}

export function statusHtml(input: {
  ready: boolean;
  chainId?: number;
  blockNumber?: string;
  x402: boolean;
  mainnet: boolean;
  shadow: {
    ok: boolean;
    enabled: boolean;
    chainId: number;
    headBlock: string | null;
    healthyRpcs: number;
    healthyObservers: number;
  };
}): string {
  const rpcLabel = input.ready
    ? `Operational · Arc Testnet ${input.chainId} · Block ${input.blockNumber}`
    : "Degraded · The current RPC readiness probe failed";
  const shadowLabel = input.shadow.ok
    ? `READ ONLY · Chain ${input.shadow.chainId} · Block ${input.shadow.headBlock} · ${input.shadow.healthyRpcs} RPC + ${input.shadow.healthyObservers} observer`
    : input.shadow.enabled
      ? "DEGRADED · Shadow consensus check failed closed"
      : "DISABLED · Shadow monitoring is not configured";
  return `${pageHead(
    "LedgerGuard | Live Status",
    "Live operating status for LedgerGuard on Arc Testnet.",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge ${input.ready ? "" : "danger"}">${input.ready ? "OPERATIONAL" : "DEGRADED"}</span></nav>
    <section class="subhero">
      <p class="eyebrow">LIVE STATUS</p>
      <h1 class="compact">${input.ready ? "All monitored services are operational" : "Some services are degraded"}</h1>
      <p class="lead">This page runs a read-only Arc Testnet RPC check when opened. It does not connect a wallet or request a signature.</p>
    </section>
    <section class="status-list">
      <article><span class="status-dot ${input.ready ? "ok" : "bad"}"></span><div><strong>Arc Testnet RPC</strong><p>${rpcLabel}</p></div></article>
      <article><span class="status-dot ${input.x402 ? "ok" : "warn"}"></span><div><strong>x402 Testnet endpoint</strong><p>${input.x402 ? "Enabled" : "Safely disabled"}</p></div></article>
      <article><span class="status-dot ${input.shadow.ok ? "ok" : input.shadow.enabled ? "bad" : "warn"}"></span><div><strong>Arc 5042 Shadow</strong><p>${shadowLabel}</p><p>Read-only observation only; no signing, transfers, or mainnet x402.</p></div></article>
      <article><span class="status-dot ${input.mainnet ? "bad" : "ok"}"></span><div><strong>Arc Mainnet</strong><p>${input.mainnet ? "Enabled — immediate review required" : "Disabled (expected state)"}</p></div></article>
    </section>
    <div class="links bottom-links"><a href="/ready">Raw readiness data</a><a href="/health">Raw process health</a><a href="/v1/shadow/arc-mainnet">5042 Shadow data</a><a href="/v1/networks">Network registry</a></div>
    ${footer}
  </main>
</body>
</html>`;
}

export const integrationBoundaryHtml = `${pageHead(
  "LedgerGuard | Integration Boundary",
  "LedgerGuard safety decisions, custody boundaries, and mainnet controls.",
)}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">SAFETY BOUNDARY</span></nav>
    <section class="subhero"><p class="eyebrow">INTEGRATION SAFETY BOUNDARY</p><h1 class="compact">What the system does — and never does</h1></section>
    <section class="docs-grid">
      <article class="doc-card"><span>DOES</span><h2>Inspect and reconcile</h2><p>Parse supported calls, run read-only simulation, match declared intent, and return a reviewable evidence summary.</p></article>
      <article class="doc-card"><span>NEVER</span><h2>Touch private keys</h2><p>Never request private keys or recovery phrases, custody assets, sign for a wallet, or initiate a real transaction automatically.</p></article>
      <article class="doc-card"><span>FAIL CLOSED</span><h2>Unknown means no ALLOW</h2><p>Unknown calls, failed simulation, network mismatch, or unapproved mainnet configuration never produce a conclusion that is safe to sign.</p></article>
    </section>
    <section class="notice"><strong>Important:</strong> LedgerGuard is an additional safety layer. It does not replace wallet confirmation, contract audits, organizational approval, or the user's final judgment.</section>
    ${footer}
  </main>
</body>
</html>`;

export const demoCss = `:root{color-scheme:dark;--bg:#07100d;--panel:#101b17;--line:#263a32;--text:#effbf5;--muted:#9bb2a8;--mint:#82f4bd;--orange:#ffb86b;--red:#ff7474}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 5%,#17382b 0,transparent 34%),var(--bg);color:var(--text);font:16px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}main{width:min(1120px,calc(100% - 40px));margin:auto}nav{height:86px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{font-weight:800;font-size:20px;letter-spacing:-.03em;text-decoration:none}.badge,.step,.eyebrow{font-size:12px;letter-spacing:.14em;font-weight:800}.badge{color:var(--mint);border:1px solid #4d896d;padding:7px 10px;border-radius:99px}.badge.danger{color:var(--red);border-color:#8b4545}.hero{padding:76px 0 48px;max-width:900px}.subhero{padding:64px 0 38px;max-width:900px}.eyebrow,.step{color:var(--mint)}h1{font-size:clamp(48px,8vw,92px);line-height:.95;letter-spacing:-.065em;margin:20px 0 26px}h1.compact{font-size:clamp(44px,6vw,70px)}h1 span{color:var(--mint)}.lead{font-size:20px;color:var(--muted);max-width:760px}.links{display:flex;gap:22px;flex-wrap:wrap;margin-top:30px}.bottom-links{margin:30px 0 54px}a{color:var(--text);text-underline-offset:5px}.notice{background:#10241c;border:1px solid #315846;border-radius:12px;padding:16px 18px;margin:0 0 28px;color:#c8e8d9}.panel{background:linear-gradient(145deg,#13241d,#0d1713);border:1px solid var(--line);border-radius:22px;padding:32px;display:grid;grid-template-columns:1fr 1fr;gap:34px;box-shadow:0 25px 80px #0005}.developer-panel{margin-bottom:28px}h2{font-size:28px;letter-spacing:-.03em;margin:8px 0}.muted,article p{color:var(--muted)}form{display:grid;gap:14px}label{display:grid;gap:6px;font-size:13px;color:var(--muted)}input{width:100%;background:#07100d;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:13px;font:inherit}input:focus{outline:2px solid var(--mint);outline-offset:1px}button{border:0;border-radius:10px;background:var(--mint);color:#07100d;font-weight:800;padding:14px;cursor:pointer}button.secondary{background:#244137;color:var(--text);border:1px solid #3d6958}button:disabled{opacity:.6}.result{grid-column:1/-1;border-left:4px solid var(--mint);background:#07100d;border-radius:8px;padding:18px;min-height:96px}.result.allow{border-color:var(--mint)}.result.review{border-color:var(--orange)}.result.block,.result.error{border-color:var(--red)}.result p{color:var(--muted);margin:6px 0}.result ul{margin:10px 0;padding-left:22px}.result details{margin-top:12px}.result pre,.code-card pre{white-space:pre-wrap;word-break:break-word;overflow:auto;background:#050b09;border:1px solid var(--line);border-radius:8px;padding:16px;color:#c8e8d9}.grid,.docs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:32px 0 64px}.grid article{border-top:1px solid var(--line);padding:22px 4px}.grid span,.doc-card span{color:var(--orange);font-size:12px;font-weight:800}.grid h3{margin:14px 0 4px}.doc-card,.code-card{background:linear-gradient(145deg,#13241d,#0d1713);border:1px solid var(--line);border-radius:16px;padding:24px}.doc-card h2{font-size:20px;overflow-wrap:anywhere}.code-card{margin-bottom:28px}.status-list{display:grid;gap:14px;margin:10px 0 30px}.status-list article{display:flex;gap:16px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px}.status-list p{margin:4px 0 0}.status-dot{width:12px;height:12px;border-radius:99px;margin-top:6px;background:var(--orange);flex:none}.status-dot.ok{background:var(--mint)}.status-dot.bad{background:var(--red)}footer{border-top:1px solid var(--line);padding:26px 0 42px;color:var(--muted);font-size:13px}@media(max-width:760px){main{width:min(100% - 24px,1120px)}.hero,.subhero{padding:48px 0 32px}.panel{grid-template-columns:1fr;padding:22px;gap:24px}.grid,.docs-grid{grid-template-columns:1fr;padding-bottom:42px}h1,h1.compact{font-size:46px}.lead{font-size:18px}}`;

export const demoJs = `const form=document.querySelector("#preflight");const result=document.querySelector("#result");const title=document.querySelector("#result-title");const summary=document.querySelector("#result-summary");const findings=document.querySelector("#result-findings");const details=document.querySelector("#result-details");const json=document.querySelector("#result-json");const usdc="0x3600000000000000000000000000000000000000";const messages={ALLOW:"The implemented checks passed. Continue only after reviewing the transaction in your wallet.",REVIEW:"Information is incomplete or an unknown condition remains. Review before proceeding.",BLOCK:"A defined risk was detected. Do not sign or send this transaction."};const clear=()=>{findings.replaceChildren();details.hidden=true;json.textContent=""};const show=(kind,heading,message)=>{result.className="result "+kind;title.textContent=heading;summary.textContent=message};const stale=(message)=>{clear();show("review","Result expired",message)};form.addEventListener("input",()=>stale("The input changed. Run the check again."));form.addEventListener("invalid",()=>stale("Correct the invalid input before running the check."),true);const units=(v)=>{if(!/^\\d+(\\.\\d{0,6})?$/.test(v))throw new Error("The amount must be a positive number with no more than 6 decimal places.");const [w,f=""]=v.split(".");const value=BigInt(w)*1000000n+BigInt((f+"000000").slice(0,6));if(value<=0n)throw new Error("The amount must be greater than zero.");return value.toString()};const address=(v,label)=>{if(!/^0x[0-9a-fA-F]{40}$/.test(v))throw new Error(label+" is not a valid EVM address.");return v};const pad=(v)=>v.slice(2).toLowerCase().padStart(64,"0");form.addEventListener("submit",async(e)=>{e.preventDefault();const button=form.querySelector("button");button.disabled=true;clear();show("neutral","Checking","Parsing the transaction and evaluating Arc Testnet policy…");try{const recipient=address(document.querySelector("#recipient").value.trim(),"Recipient address");const payerValue=document.querySelector("#payer").value.trim();const payer=payerValue?address(payerValue,"Payer public address"):"";const amount=units(document.querySelector("#amount").value.trim());const limit=units(document.querySelector("#limit").value.trim());const data="0xa9059cbb"+pad(recipient)+BigInt(amount).toString(16).padStart(64,"0");const intent={action:"transfer",expectedRecipient:recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:amount,purpose:"LedgerGuard browser demo"};if(payer)intent.expectedDebitAddress=payer;const payload={network:"arcTestnet",to:usdc,data,valueWei:"0",intent,policy:{requireSimulation:Boolean(payer),maxAmountMicroUsdc:limit}};if(payer)payload.from=payer;const response=await fetch("/v1/preflight",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const body=await response.json();if(!response.ok)throw new Error(body.message||body.error||"Request failed");show(body.decision.toLowerCase(),body.decision,messages[body.decision]||"Check completed.");for(const item of body.findings||[]){const li=document.createElement("li");li.textContent=item.code+": "+item.message;findings.append(li)}if(!body.findings?.length){const li=document.createElement("li");li.textContent="No known issue was found in the recipient, asset, amount, payer, or simulation.";findings.append(li)}json.textContent=JSON.stringify(body,null,2);details.hidden=false}catch(error){show("error","Check failed",error instanceof Error?error.message:"Unknown error");}finally{button.disabled=false}});`;

export const developerConsoleJs = `const registerForm=document.querySelector("#developer-register");const loginForm=document.querySelector("#developer-login");const keyInput=document.querySelector("#developer-key");const result=document.querySelector("#developer-result");const title=document.querySelector("#developer-title");const summary=document.querySelector("#developer-summary");const actions=document.querySelector("#developer-actions");const details=document.querySelector("#developer-details");const output=document.querySelector("#developer-json");const runButton=document.querySelector("#developer-run");const rotateButton=document.querySelector("#developer-rotate");const copyButton=document.querySelector("#developer-copy");let apiKey=sessionStorage.getItem("ledgerguard.test.apiKey")||"";if(apiKey)keyInput.value=apiKey;const show=(kind,heading,message,data)=>{result.className="result "+kind;title.textContent=heading;summary.textContent=message;if(data){output.textContent=JSON.stringify(data,null,2);details.hidden=false}else{output.textContent="";details.hidden=true}};const remember=(value)=>{apiKey=value;keyInput.value=value;sessionStorage.setItem("ledgerguard.test.apiKey",value);actions.hidden=false};const request=async(path,options={})=>{const headers={...(options.headers||{})};if(apiKey)headers.authorization="Bearer "+apiKey;const response=await fetch(path,{...options,headers});const body=await response.json().catch(()=>({error:"INVALID_RESPONSE"}));if(!response.ok){const error=new Error(body.message||body.error||"Request failed");error.body=body;throw error}return body};const load=async()=>{const body=await request("/v1/developer/account");actions.hidden=false;show("allow","Account loaded",body.usage.used+" of "+body.usage.limit+" testnet units used this month.",body)};registerForm.addEventListener("submit",async(event)=>{event.preventDefault();show("neutral","Creating account","Allocating a revocable test key in the durable store…");try{const body=await request("/v1/developer/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:document.querySelector("#developer-name").value.trim()})});remember(body.apiKey);show("allow","Test API key created","Save the key now. It is displayed only once by the service.",body);actions.hidden=false}catch(error){show("error","Registration failed",error.message,error.body)}});loginForm.addEventListener("submit",async(event)=>{event.preventDefault();remember(keyInput.value.trim());try{await load()}catch(error){actions.hidden=true;show("error","Could not load account",error.message,error.body)}});runButton.addEventListener("click",async()=>{show("neutral","Running metered check","Recording one unit and evaluating a deterministic Arc Testnet request…");const recipient="0x2222222222222222222222222222222222222222";const usdc="0x3600000000000000000000000000000000000000";const data="0xa9059cbb"+recipient.slice(2).padStart(64,"0")+"00000000000000000000000000000000000000000000000000000000000f4240";try{const body=await request("/v1/developer/preflight",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({network:"arcTestnet",to:usdc,data,valueWei:"0",intent:{action:"transfer",expectedRecipient:recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:"1000000",purpose:"Developer console metered test"},policy:{requireSimulation:false,maxAmountMicroUsdc:"1000000"}})});show(body.decision==="BLOCK"?"block":"review","Metered preflight: "+body.decision,"Usage was recorded in the durable ledger.",body)}catch(error){show("error","Metered request failed",error.message,error.body)}});rotateButton.addEventListener("click",async()=>{if(!confirm("Rotate this API key? The current key will stop working immediately."))return;try{const body=await request("/v1/developer/keys/rotate",{method:"POST"});remember(body.apiKey);show("allow","API key rotated","The previous key is revoked. Save the replacement now.",body)}catch(error){show("error","Key rotation failed",error.message,error.body)}});copyButton.addEventListener("click",async()=>{if(!apiKey)return;try{await navigator.clipboard.writeText(apiKey);show("allow","API key copied","The current test key was copied to the clipboard.")}catch{show("error","Copy failed","Copy the key manually from the key field.")}});`;
