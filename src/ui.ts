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

const footer = `<footer>LedgerGuard &middot; Protect + Meter &middot; Arc Public Testnet only. Mainnet stays disabled until release gates pass. <a href="/protect">Protect</a> &middot; <a href="/meter">Meter</a> &middot; <a href="/receipts">Receipts</a> &middot; <a href="/developers">Developers</a> &middot; <a href="https://x.com/HuiLibaa" rel="me noreferrer">Official X @HuiLibaa</a> &middot; <a href="mailto:lw22336599@gmail.com">Email</a> &middot; <a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">GitHub</a></footer>`;

const portalNavLinks = `<a href="/protect">Protect</a><a href="/routes">Routes</a><a href="/meter">Meter</a><a href="/receipts">Receipts</a><a href="/developers">Developers</a><a href="/status">Status</a><a href="https://x.com/HuiLibaa" rel="me noreferrer">X @HuiLibaa</a>`;

export function portalNavHtml(badge = "ARC PUBLIC TESTNET"): string {
  return `<nav class="portal-nav">
      <a class="brand" href="/">LedgerGuard</a>
      <button id="nav-menu-toggle" class="nav-menu-toggle" type="button" aria-expanded="false" aria-controls="nav-mobile-panel">Menu</button>
      <div class="portal-nav-links">${portalNavLinks}</div>
      <div id="nav-mobile-panel" class="nav-mobile-panel" aria-label="Mobile navigation">${portalNavLinks}</div>
      <button id="nav-connect" class="nav-wallet-btn" type="button">Connect Wallet</button>
      <span id="nav-wallet-display" class="nav-wallet-display"></span>
      <span class="badge">${badge}</span>
    </nav>`;
}

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
  issuer?: string;
  intentId: string;
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
    ["Requested by", input.issuer ?? "Not declared"],
    [
      "Sender identity",
      input.issuer
        ? "Self-declared · not independently verified"
        : "Not verified",
    ],
    ["Pay from", input.payer],
    ["Pay to", input.recipient],
    ["Amount", `${input.amount} USDC`],
    ["Purpose", input.purpose],
    ["Maximum allowed", `${input.limit} USDC`],
    ["Valid until", input.validUntil ?? "Not declared"],
    ["Network", "Arc Testnet"],
    ["Intent reference", input.intentId],
  ];
  const decisionLabel =
    input.decision === "ALLOW"
      ? "Checks passed"
      : input.decision === "BLOCK"
        ? "Payment blocked"
        : "Review required";
  const decisionSummary =
    input.decision === "ALLOW"
      ? "The deterministic checks and read-only simulation passed. Review the exact wallet transaction before signing."
      : input.decision === "BLOCK"
        ? "A defined policy risk was detected. Do not sign or send this payment."
        : "The payer or another required condition is incomplete. Connect a test wallet or inspect the evidence before proceeding.";
  return `${pageHead(
    "LedgerGuard | Payment Intent Receipt",
    "A prefilled, human-readable Arc Testnet payment intent and deterministic safety decision.",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">PREFILLED GUARD LINK</span></nav>
    <section class="subhero">
      <p class="eyebrow">NO CUSTODY &middot; EXPLICIT WALLET APPROVAL</p>
      <h1 class="compact">Payment intent receipt</h1>
      <p class="lead">See who requested the payment, who receives it, how much can move, and why—before a wallet signs.</p>
    </section>
    <section class="panel">
      <div>
        <p class="step">DECLARED INTENT</p>
        <dl>${fields.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl>
      </div>
      <section class="result ${input.decision.toLowerCase()}">
        <span class="decision-code">${escapeHtml(input.decision)}</span>
        <strong>${escapeHtml(decisionLabel)}</strong>
        <p>${escapeHtml(decisionSummary)}</p>
        <details><summary>View evidence</summary>
          <ul>${input.findings.map((finding) => `<li><strong>${escapeHtml(finding.code)}</strong>: ${escapeHtml(finding.message)}</li>`).join("")}</ul>
          <p>Request ID: <code>${escapeHtml(input.requestId)}</code></p>
        </details>
      </section>
    </section>
    <section id="guard-wallet"
      class="wallet-panel"
      data-decision="${escapeHtml(input.decision)}"
      data-payer="${escapeHtml(input.payer === "Not declared" ? "" : input.payer)}"
      data-recipient="${escapeHtml(input.recipient)}"
      data-amount="${escapeHtml(input.amount)}"
      data-purpose="${escapeHtml(input.purpose)}">
      <div>
        <p class="step">OPTIONAL TESTNET COMPLETION</p>
        <h2>Continue in your wallet</h2>
        <p id="wallet-status" class="muted">LedgerGuard never receives your private key. Your wallet shows the exact transaction and asks for final approval.</p>
      </div>
      <div class="wallet-buttons">
        <button id="connect-wallet" type="button" class="secondary">Connect test wallet</button>
        <button id="send-payment" type="button" disabled>Review test payment in wallet</button>
        <button id="verify-evidence" type="button" class="secondary" hidden>Verify onchain result</button>
      </div>
      <section id="wallet-result" class="result neutral" hidden aria-live="polite"></section>
    </section>
    <section class="notice"><strong>Testnet only:</strong> Arc Testnet assets have no financial value. No mainnet transaction can be initiated from this page. A self-declared sender name is context, not verified identity.</section>
    <div class="links bottom-links"><a href="/guard/create">Create a Guard Link</a><a href="/protect">Open advanced checker</a><a href="/docs">Developer docs</a><a href="/test">Join testing</a></div>
    ${footer}
  </main>
  <script src="/wallet.js" defer></script>
  <script src="/guard.js" defer></script>
</body>
</html>`;
}

export const guardBuilderHtml = `${pageHead(
  "LedgerGuard | Create a Guard Link",
  "Create a prefilled Arc Testnet payment intent that anyone can review before signing.",
)}
<body>
  <main>
    ${portalNavHtml("GUARD LINK BUILDER")}
    <section class="subhero">
      <p class="eyebrow">NO SERVER-SIDE WALLET &middot; TESTNET ONLY</p>
      <h1 class="compact">Create one clear payment request.</h1>
      <p class="lead">Prefill the recipient, amount, purpose, limit, and expiry. The recipient can review the request without understanding calldata or policy fields.</p>
    </section>
    <section class="panel builder-panel">
      <div id="wallet-section" class="wallet-status-card">
        <div class="wallet-status-row">
          <div id="w-dot" class="wallet-status-dot"></div>
          <span id="w-status" class="wallet-status-label">No wallet connected</span>
          <button id="w-btn" type="button" class="nav-wallet-btn">Connect Wallet</button>
        </div>
        <div id="w-detail" class="wallet-status-detail" hidden></div>
      </div>
      <form id="guard-builder">
        <label>Requested by (optional, self-declared)<input id="guard-issuer" name="issuer" maxlength="80" placeholder="Example Agent or merchant"></label>
        <label>Recipient public address<input id="guard-recipient" name="recipient" value="0x2222222222222222222222222222222222222222" required pattern="0x[0-9a-fA-F]{40}" autocomplete="off"></label>
        <label>Amount (USDC)<input id="guard-amount" name="amount" value="1.00" required inputmode="decimal" pattern="(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,6})?"></label>
        <label>Maximum allowed (USDC)<input id="guard-limit" name="limit" value="1.00" required inputmode="decimal" pattern="(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,6})?"></label>
        <label>Purpose<input id="guard-purpose" name="purpose" value="Example invoice" required maxlength="120"></label>
        <label>Expires in hours<input id="guard-expiry-hours" name="expiryHours" value="24" required type="number" min="1" max="168" step="1"></label>
        <button type="submit">Create Guard Link</button>
      </form>
      <section id="guard-builder-result" class="result neutral" aria-live="polite">
        <strong>Ready</strong>
        <p>Create a time-bound link. No private information or wallet credential is stored.</p>
        <input id="guard-created-url" readonly hidden aria-label="Created Guard Link">
        <div id="guard-builder-actions" class="wallet-buttons" hidden>
          <button id="guard-copy" type="button" class="secondary">Copy link</button>
          <button id="guard-share" type="button" class="secondary">Share</button>
          <a id="guard-open" class="button-link" href="/guard/create">Open receipt</a>
        </div>
      </section>
    </section>
    <section class="notice"><strong>Identity boundary:</strong> the sender name is self-declared. It is not proof that a company or domain authorized the request. LedgerGuard still binds and checks the exact payment fields.</section>
    ${footer}
  </main>
  <script src="/wallet.js" defer></script>
  <script src="/guard-builder.js" defer></script>
  <script src="/guard-builder-wallet.js" defer></script>
</body>
</html>`;

export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="LedgerGuard">
  <defs><linearGradient id="g" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse"><stop stop-color="#6f8cff"/><stop offset="1" stop-color="#9c6cff"/></linearGradient></defs>
  <rect width="64" height="64" rx="16" fill="#060817"/>
  <path d="M32 10 51 18v13c0 12-7.5 20.5-19 24-11.5-3.5-19-12-19-24V18l19-8Z" fill="url(#g)"/>
  <path d="M32 18v28c7.2-3 11-8.2 11-15.5v-7L32 18Z" fill="#f4f6ff" fill-opacity=".92"/>
</svg>`;

export function routesHtml(input: {
  maxAmountUsdc: string;
  customFeeUsdc: string;
  feeRecipient: string | null;
}): string {
  const effectiveFee = input.feeRecipient ? input.customFeeUsdc : "0";
  return `${pageHead(
    "LedgerGuard Routes | Protected CCTP transfer",
    "Quote and execute a capped Base Sepolia to Arc Testnet USDC transfer with browser wallet approval and CCTP evidence.",
  )}
<body>
  <main>
    ${portalNavHtml("CAPPED TEST ROUTE")}
    <section class="subhero route-hero">
      <p class="eyebrow">BASE SEPOLIA &rarr; ARC TESTNET &middot; CCTP STANDARD</p>
      <h1 class="compact">Quote first. Sign second. Verify the mint.</h1>
      <p class="lead">Circle App Kit executes the bridge. LedgerGuard limits the route, shows the fee before signing, and independently reconciles burn, attestation, mint and final delivery.</p>
    </section>
    <section id="route-app" class="route-grid"
      data-max-amount="${escapeHtml(input.maxAmountUsdc)}"
      data-custom-fee="${escapeHtml(effectiveFee)}"
      data-fee-recipient="${escapeHtml(input.feeRecipient ?? "")}">
      <article class="route-card">
        <p class="step">1 &middot; DECLARE</p>
        <h2>Protected test route</h2>
        <dl>
          <dt>From</dt><dd>Base Sepolia</dd>
          <dt>To</dt><dd>Arc Testnet</dd>
          <dt>Asset</dt><dd>Test USDC</dd>
          <dt>Maximum bridge</dt><dd>${escapeHtml(input.maxAmountUsdc)} USDC</dd>
          <dt>LedgerGuard fee</dt><dd>${escapeHtml(effectiveFee)} test USDC</dd>
          <dt>Custody</dt><dd>None</dd>
        </dl>
        <label>Amount (test USDC)<input id="route-amount" value="${escapeHtml(input.maxAmountUsdc)}" inputmode="decimal"></label>
        <label>Destination recipient<input id="route-recipient" placeholder="0x..." autocomplete="off"></label>
      </article>
      <article class="route-card">
        <p class="step">2 &middot; CONNECT + QUOTE</p>
        <h2>Wallet: <span id="route-wallet">not connected</span></h2>
        <p id="route-status" class="muted">The quote is read-only. Execution requires explicit browser-wallet signatures.</p>
        <section id="route-readiness" class="route-readiness neutral" aria-live="polite"></section>
        <div class="wallet-buttons">
          <button id="route-connect" type="button" class="secondary">Connect wallet</button>
          <button id="route-quote" type="button" disabled>Get protected quote</button>
          <button id="route-execute" type="button" disabled>Review and execute</button>
        </div>
        <section id="route-quote-output" class="result neutral" hidden aria-live="polite"></section>
      </article>
      <article class="route-card route-evidence">
        <p class="step">3 &middot; VERIFY</p>
        <h2>Four-stage evidence</h2>
        <div class="stage-row"><span>Burn</span><span>Circle attestation</span><span>Mint</span><span>Final USDC delivery</span></div>
        <section id="route-progress-output" class="result neutral" hidden aria-live="polite"></section>
      </article>
    </section>
    <section class="notice"><strong>Safety boundary:</strong> this page cannot initiate Arc Mainnet or Base Mainnet transfers. It never receives a seed phrase or private key. Changing the amount after a quote invalidates execution.</section>
    ${footer}
  </main>
  <script src="/wallet.js" defer></script>
  <script src="/routes.js" defer></script>
  <script src="/site-nav.js" defer></script>
</body>
</html>`;
}

export const testnetHelpHtml = `${pageHead(
  "LedgerGuard | Testnet funding guide",
  "Step-by-step guide to fund a wallet on Base Sepolia for the protected crosschain test route.",
)}
<body>
  <main>
    ${portalNavHtml("TESTNET FUNDING")}
    <section class="subhero">
      <p class="eyebrow">BASE SEPOLIA ONLY &middot; NO REAL FUNDS</p>
      <h1 class="compact">Fund your wallet for the crosschain demo.</h1>
      <p class="lead">The protected route needs a small amount of Base Sepolia test ETH (gas) and test USDC. LedgerGuard cannot claim faucet tokens for you because every faucet requires your browser to pass anti-abuse checks.</p>
    </section>
    <section class="panel builder-panel">
      <div id="fund-wallet-panel" class="wallet-status-card">
        <div class="wallet-status-row">
          <div id="fund-dot" class="wallet-status-dot"></div>
          <span id="fund-status" class="wallet-status-label">Wallet not connected</span>
          <button id="fund-connect" type="button" class="nav-wallet-btn">Connect Wallet</button>
        </div>
        <p id="fund-address" class="wallet-status-detail" hidden></p>
        <div class="wallet-buttons">
          <button id="fund-copy" type="button" class="secondary" disabled>Copy address</button>
          <button id="fund-refresh" type="button" class="secondary" disabled>Refresh balances</button>
        </div>
        <section id="fund-balances" class="route-readiness neutral" aria-live="polite">
          <strong>Balances on Base Sepolia</strong>
          <p>Connect a wallet to read test ETH and test USDC balances.</p>
        </section>
      </div>
      <section class="docs-grid">
        <article class="doc-card"><span>STEP 1</span><h2>Get test ETH</h2><p>You need a little Base Sepolia ETH to pay gas before USDC can move.</p><a href="https://www.alchemy.com/faucets/base-sepolia" rel="noreferrer" target="_blank">Alchemy Base Sepolia faucet</a></article>
        <article class="doc-card"><span>STEP 2</span><h2>Get test USDC</h2><p>Circle sends up to 20 test USDC on Base Sepolia every 2 hours per wallet.</p><a href="https://faucet.circle.com/" rel="noreferrer" target="_blank">Circle testnet faucet</a></article>
        <article class="doc-card"><span>STEP 3</span><h2>Return to Routes</h2><p>Switch to Base Sepolia, refresh balances here, then open the protected route.</p><a href="/routes">Open protected route</a></article>
      </section>
    </section>
    <section class="notice"><strong>Why faucets fail:</strong> Coinbase and Alchemy often require mainnet activity, verified accounts, or regional eligibility. If Circle shows “Limit Exceeded”, wait 2 hours or try another wallet. If you are still blocked, email <a href="mailto:lw22336599@gmail.com">lw22336599@gmail.com</a> with your public address and we can review manual testnet support options.</section>
    ${footer}
  </main>
  <script src="/wallet.js" defer></script>
  <script src="/testnet-help.js" defer></script>
  <script src="/site-nav.js" defer></script>
</body>
</html>`;

export const testnetHelpJs = `const BASE_SEPOLIA={chainId:"0x14a34",chainName:"Base Sepolia",nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18},rpcUrls:["https://sepolia.base.org"],blockExplorerUrls:["https://sepolia.basescan.org"]};const USDC="0x036CbD53842c5426634c792Dc1eC00166AEAcF62";const connect=document.querySelector("#fund-connect");const copy=document.querySelector("#fund-copy");const refresh=document.querySelector("#fund-refresh");const status=document.querySelector("#fund-status");const dot=document.querySelector("#fund-dot");const address=document.querySelector("#fund-address");const balances=document.querySelector("#fund-balances");const wallet=()=>window.LedgerGuardWallet;const fmtUsdc=(micro)=>{const whole=micro/1000000n;const fraction=micro%1000000n;return whole+"."+fraction.toString().padStart(6,"0").replace(/0+$/,"").replace(/\\.$/,".0")};const fmtEth=(wei)=>{const whole=wei/1000000000000000000n;const fraction=wei%1000000000000000000n;return whole+"."+fraction.toString().padStart(18,"0").slice(0,6).replace(/0+$/,"")};async function renderBalances(){if(!wallet()||!wallet().getState().connected){balances.className="route-readiness neutral";balances.innerHTML="<strong>Balances on Base Sepolia</strong><p>Connect a wallet to read test ETH and test USDC balances.</p>";return}try{await wallet().ensureChain(BASE_SEPOLIA);const ethRaw=await wallet().getProvider().request({method:"eth_getBalance",params:[wallet().getState().account,"latest"]});const usdcRaw=await wallet().readErc20Balance(USDC);const eth=fmtEth(BigInt(ethRaw));const usdc=fmtUsdc(usdcRaw);const ready=BigInt(ethRaw)>0n&&usdcRaw>0n;balances.className="route-readiness "+(ready?"allow":"review");balances.innerHTML="<strong>Balances on Base Sepolia</strong><p>ETH: <strong>"+eth+"</strong> · USDC: <strong>"+usdc+"</strong></p><p>"+(ready?"You can return to /routes and request a quote.":"You still need test ETH and/or test USDC. Use the faucet links above.")+"</p>"}catch(error){balances.className="route-readiness review";balances.innerHTML="<strong>Could not read balances</strong><p>"+(error instanceof Error?error.message:"Unknown error")+"</p>"}}function renderWallet(){if(!wallet())return;const state=wallet().getState();if(state.connected){status.textContent="Connected";dot.style.background="#4ade80";address.hidden=false;address.textContent=state.account;copy.disabled=false;refresh.disabled=false;connect.textContent="Disconnect"}else{status.textContent="Wallet not connected";dot.style.background="#555";address.hidden=true;copy.disabled=true;refresh.disabled=true;connect.textContent="Connect Wallet"}void renderBalances()}if(wallet()){wallet().subscribe(()=>renderWallet());void wallet().restore().finally(renderWallet)}connect?.addEventListener("click",async()=>{connect.disabled=true;try{if(wallet().getState().connected)wallet().disconnect();else{await wallet().connect();try{await wallet().ensureChain(BASE_SEPOLIA)}catch{}}}finally{connect.disabled=false}});copy?.addEventListener("click",async()=>{const value=wallet()?.getState().account;if(!value)return;try{await navigator.clipboard.writeText(value);status.textContent="Address copied"}catch{status.textContent="Copy the address manually"}});refresh?.addEventListener("click",()=>{void renderBalances()});`;

export const portalHtml = `${pageHead(
  "LedgerGuard | Protect payments. Meter delivery.",
  "One control and settlement platform for agent payments: Protect evaluates intent, while Meter charges for delivery and records verifiable receipts.",
)}
<body>
  <main>
    ${portalNavHtml()}
    <section class="hero portal-hero">
      <p class="eyebrow">ONE BUSINESS &middot; TWO ISOLATED SERVICES</p>
      <h1>Control what may be paid.<br><span>Prove what was delivered.</span></h1>
      <p class="lead">LedgerGuard connects deterministic payment protection with settlement-linked delivery. Protect checks the intent before signing. Meter charges protected API and MCP calls, then records settlement and delivery receipts.</p>
      <div class="portal-actions"><a class="primary-action" href="/routes">Open protected route</a><a class="secondary-action" href="/guard/create">Create a Guard Link</a></div>
      <p class="portal-truth">Non-custodial. No private keys. Browser signing is live on the capped test route. Base Mainnet real-funds execution remains disabled.</p>
    </section>
    <section class="product-map" aria-label="LedgerGuard products">
      <article class="product-module protect-module">
        <div class="module-number">01 / PROTECT</div>
        <h2>Decide before a wallet signs.</h2>
        <p>Bind payer, recipient, asset, amount and purpose to deterministic policy. Unknown conditions fail closed.</p>
        <ul><li>Guard Links for people</li><li>Preflight API, SDK and MCP</li><li>Post-settlement evidence</li></ul>
        <a href="/guard/create">Create a Guard Link &rarr;</a>
      </article>
      <article class="product-module meter-module">
        <div class="module-number">02 / METER</div>
        <h2>Settle before delivery.</h2>
        <p>Issue an x402 quote, verify settlement, deliver the protected resource and persist linked receipts.</p>
        <ul><li>Paid HTTP and MCP resource</li><li>Settlement + delivery receipts</li><li>Tenant-linked usage events</li></ul>
        <a href="/meter">Open the Meter module &rarr;</a>
      </article>
    </section>
    <section class="platform-flow">
      <p class="eyebrow">ONE ACCEPTANCE PATH</p>
      <h2>Protect &rarr; Meter &rarr; Receipts</h2>
      <div class="flow-row"><span>Declare intent</span><span>ALLOW / REVIEW / BLOCK</span><span>402 settlement</span><span>Protected delivery</span><span>Dual receipt</span></div>
      <div class="links"><a href="/developers">Developer quickstart</a><a href="/catalog">Service catalog</a><a href="/test">Join public testing</a><a href="/status">Live status</a></div>
    </section>
    <section class="notice"><strong>Current status:</strong> the protected API/MCP payment path, durable receipts, and capped browser-wallet crosschain route are implemented on test networks. An externally signed end-to-end crosschain record, repeat partner use, and a paid pilot remain acceptance gates.</section>
    ${footer}
  </main>
  <script src="/wallet.js" defer></script>
  <script src="/site-nav.js" defer></script>
</body>
</html>`;

export const demoHtml = `${pageHead(
  "LedgerGuard | Arc Payment Safety Check",
  "LedgerGuard checks Arc USDC payment intent before signing without accessing private keys or signing for users.",
)}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard <small>/ Protect</small></a><div class="nav-actions"><a href="/meter">Meter</a><span class="badge">ARC TESTNET</span></div></nav>
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

export const demoCss = `:root{color-scheme:dark;--bg:#060817;--panel:#0d1228;--line:#273052;--text:#f4f6ff;--muted:#9ba6c8;--mint:#8aa4ff;--orange:#b990ff;--red:#ff758d;--brand:#6f8cff;--brand-2:#9c6cff;--success:#55d6a7}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 82% 4%,#5536c638 0,transparent 30rem),radial-gradient(circle at 12% 20%,#245bca2f 0,transparent 34rem),var(--bg);color:var(--text);font:16px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}main{width:min(1180px,calc(100% - 48px));margin:auto}nav{min-height:80px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid var(--line)}.brand{font-weight:800;font-size:21px;letter-spacing:-.03em;text-decoration:none;color:var(--text)}.badge,.step,.eyebrow{font-size:12px;letter-spacing:.14em;font-weight:800}.badge{color:#b8c6ff;border:1px solid #52649f;background:#111936cc;padding:7px 10px;border-radius:99px}.badge.danger{color:var(--red);border-color:#8b4545}.hero{padding:76px 0 48px;max-width:900px}.subhero{padding:64px 0 38px;max-width:900px}.eyebrow,.step{color:#aebcff}h1{font-size:clamp(48px,8vw,92px);line-height:.95;letter-spacing:-.065em;margin:20px 0 26px}h1.compact{font-size:clamp(44px,6vw,70px)}h1 span{background:linear-gradient(90deg,#88a2ff,#bc8cff);-webkit-background-clip:text;background-clip:text;color:transparent}.lead{font-size:20px;color:var(--muted);max-width:760px}.links{display:flex;gap:22px;flex-wrap:wrap;margin-top:30px}.bottom-links{margin:30px 0 54px}a{color:var(--text);text-underline-offset:5px}.notice{background:#111a38;border:1px solid #344273;border-radius:12px;padding:16px 18px;margin:0 0 28px;color:#cbd3ef;box-shadow:inset 3px 0 #718aff}.panel{background:linear-gradient(145deg,#111831e8,#090d1ee8);border:1px solid var(--line);border-radius:22px;padding:32px;display:grid;grid-template-columns:1fr 1fr;gap:34px;box-shadow:0 25px 80px #0005}.developer-panel{margin-bottom:28px}h2{font-size:28px;letter-spacing:-.03em;margin:8px 0}.muted,article p{color:var(--muted)}form{display:grid;gap:14px}label{display:grid;gap:6px;font-size:13px;color:var(--muted)}input{width:100%;background:#070b1a;border:1px solid #334065;border-radius:10px;color:var(--text);padding:13px;font:inherit}input:focus{outline:2px solid var(--brand);outline-offset:1px;box-shadow:0 0 0 4px #6f8cff20}button{border:0;border-radius:10px;background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;font-weight:800;padding:14px;cursor:pointer}button.secondary{background:#151e3e;color:var(--text);border:1px solid #3b4a79}button:disabled{opacity:.6}.result{grid-column:1/-1;border-left:4px solid var(--success);background:#070b19;border-radius:8px;padding:18px;min-height:96px}.result.allow{border-color:var(--success)}.result.review{border-color:var(--orange)}.result.block,.result.error{border-color:var(--red)}.result p{color:var(--muted);margin:6px 0}.result ul{margin:10px 0;padding-left:22px}.result details{margin-top:12px}.result pre,.code-card pre{white-space:pre-wrap;word-break:break-word;overflow:auto;background:#070b19;border:1px solid #2c365a;border-radius:8px;padding:16px;color:#c8d0ef}.grid,.docs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:32px 0 64px}.grid article{border-top:1px solid var(--line);padding:22px 4px}.grid span,.doc-card span{color:var(--orange);font-size:12px;font-weight:800}.grid h3{margin:14px 0 4px}.doc-card,.code-card{background:linear-gradient(145deg,#111831e8,#090d1ee8);border:1px solid var(--line);border-radius:16px;padding:24px}.doc-card h2{font-size:20px;overflow-wrap:anywhere}.code-card{margin-bottom:28px}.status-list{display:grid;gap:14px;margin:10px 0 30px}.status-list article{display:flex;gap:16px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px}.status-list p{margin:4px 0 0}.status-dot{width:12px;height:12px;border-radius:99px;margin-top:6px;background:var(--orange);flex:none}.status-dot.ok{background:var(--success)}.status-dot.bad{background:var(--red)}footer{border-top:1px solid var(--line);padding:26px 0 42px;color:var(--muted);font-size:13px}@media(max-width:760px){main{width:min(100% - 28px,1180px)}.hero,.subhero{padding:48px 0 32px}.panel{grid-template-columns:1fr;padding:22px;gap:24px}.grid,.docs-grid{grid-template-columns:1fr;padding-bottom:42px}h1,h1.compact{font-size:46px}.lead{font-size:18px}}`;

export const unifiedBrandCss = `
:root{
  --bg:#060817;
  --panel:#0d1228;
  --line:#273052;
  --text:#f4f6ff;
  --muted:#9ba6c8;
  --mint:#8aa4ff;
  --orange:#b990ff;
  --red:#ff758d;
  --brand:#6f8cff;
  --brand-2:#9c6cff;
  --success:#55d6a7;
}
html{scroll-behavior:smooth}
body{
  min-height:100vh;
  background:
    radial-gradient(circle at 82% 4%,#5536c638 0,transparent 30rem),
    radial-gradient(circle at 12% 20%,#245bca2f 0,transparent 34rem),
    linear-gradient(#ffffff06 1px,transparent 1px),
    linear-gradient(90deg,#ffffff06 1px,transparent 1px),
    var(--bg);
  background-size:auto,auto,56px 56px,56px 56px,auto;
}
main{width:min(1180px,calc(100% - 48px))}
nav{min-height:80px;gap:24px;border-color:#ffffff19}
.brand{display:inline-flex;align-items:center;gap:8px;font-size:21px}
.brand::before{content:"";width:11px;height:25px;border-radius:3px;background:linear-gradient(180deg,var(--brand),var(--brand-2));box-shadow:0 0 28px #6f8cff70}
.brand small{color:#aebcff;font:800 11px/1 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}
.portal-nav-links,.nav-actions{display:flex;align-items:center;gap:24px}
.portal-nav-links a,.nav-actions a{color:var(--muted);font-size:14px;text-decoration:none}
.portal-nav-links a:hover,.nav-actions a:hover{color:var(--text)}
.badge{color:#b8c6ff;border-color:#52649f;background:#111936cc;box-shadow:inset 0 0 20px #6f8cff14}
.eyebrow,.step{color:#aebcff;font-family:ui-monospace,Consolas,monospace}
.hero{padding:92px 0 58px}
.portal-hero{max-width:1080px;padding-bottom:84px}
h1{font-size:clamp(54px,8vw,98px);line-height:.94}
h1 span{background:linear-gradient(90deg,#88a2ff,#bc8cff);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{max-width:850px;color:#abb4d2;line-height:1.65}
.portal-actions a{padding:14px 20px;border-radius:8px;box-shadow:0 10px 35px #0004}
.primary-action,button{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff}
.secondary-action{border-color:#4a567d;background:#0d1430}
.portal-truth{padding-left:14px;border-left:2px solid #667de0;color:#8e99ba}
.route-hero{max-width:900px}.route-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.route-card{background:linear-gradient(145deg,#10162b,#0a0f20);border:1px solid #283251;border-radius:18px;padding:28px;box-shadow:0 24px 70px #02040c80}.route-evidence{grid-column:1/-1}.stage-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.stage-row span{padding:12px;border:1px solid #303a5d;border-radius:10px;background:#0b1123;color:#bdc7e8;text-align:center}.route-card dl{grid-template-columns:minmax(120px,.7fr) 1fr}.route-card input{width:100%;box-sizing:border-box}
.product-map{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:90px}
.product-module,.doc-card,.code-card,.panel,.status-list article{
  background:linear-gradient(145deg,#111831e8,#090d1ee8);
  border:1px solid #2b355b;
  box-shadow:0 24px 70px #0004;
}
.product-module{position:relative;overflow:hidden;min-height:420px;padding:36px;border-radius:18px;display:flex;flex-direction:column}
.product-module::after{content:"";position:absolute;right:-100px;bottom:-130px;width:270px;height:270px;border-radius:50%;background:#6f8cff18;filter:blur(2px)}
.meter-module{border-color:#4b3b72;background:linear-gradient(145deg,#17152ce8,#0b0c1de8)}
.meter-module::after{background:#a96cff1c}
.module-number{color:#aebcff;font:800 12px/1 ui-monospace,monospace;letter-spacing:.16em}
.product-module h2{font-size:clamp(32px,4vw,50px);line-height:1;max-width:480px;margin:42px 0 18px}
.product-module p,.product-module ul{position:relative;z-index:1;color:var(--muted)}
.product-module ul{padding-left:20px;line-height:1.9}
.product-module>a{position:relative;z-index:1;margin-top:auto;color:#bec9ff;font-weight:800}
.platform-flow{padding:78px 0;border-top:1px solid var(--line)}
.platform-flow h2{font-size:clamp(38px,6vw,68px)}
.flow-row{display:grid;grid-template-columns:repeat(5,1fr);margin-top:34px;border:1px solid var(--line);background:#0a0f23}
.flow-row span{min-height:92px;padding:18px;display:flex;align-items:center;border-right:1px solid var(--line);color:var(--muted);font-size:13px}
.flow-row span:last-child{border-right:0;color:#c6d0ff;background:#151d3c}
.notice{border-color:#344273;background:#111a38;color:#cbd3ef;box-shadow:inset 3px 0 #718aff}
.panel{border-radius:18px}
input{background:#070b1a;border-color:#334065;border-radius:8px}
input:focus{outline-color:#7d96ff;box-shadow:0 0 0 4px #6f8cff20}
button{border-radius:8px}
button.secondary{background:#151e3e;border-color:#3b4a79}
.result,.result pre,.code-card pre{background:#070b19;border-color:#2c365a}
.result.allow{border-color:var(--success)}
.result.review{border-color:#ba91ff}
.result.block,.result.error{border-color:var(--red)}
.grid,.docs-grid{gap:20px}
.doc-card,.code-card{border-radius:14px}
.grid span,.doc-card span{color:#a991ff}
.status-dot.ok{background:var(--success);box-shadow:0 0 14px #55d6a780}
.status-dot.bad{background:var(--red)}
.decision-code{display:block;margin-bottom:6px;color:#aebcff;font:800 11px/1 ui-monospace,Consolas,monospace;letter-spacing:.14em}
.wallet-panel{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:28px 0;padding:28px;border:1px solid #2b355b;border-radius:16px;background:linear-gradient(145deg,#111831e8,#090d1ee8)}
.wallet-buttons{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.wallet-buttons button{flex:1;min-width:170px}
.wallet-panel>.result{grid-column:1/-1}
.button-link{display:inline-flex;align-items:center;justify-content:center;padding:13px 16px;border-radius:8px;background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;text-decoration:none;font-weight:800}
.builder-panel{align-items:start}
.builder-panel .result input{margin:14px 0}
.builder-panel form{grid-template-columns:1fr 1fr}
.builder-panel form label:nth-of-type(1),.builder-panel form label:nth-of-type(2),.builder-panel form label:nth-of-type(5),.builder-panel form button{grid-column:1/-1}
.links a{color:#c6d0ff}
.nav-wallet-btn,#nav-connect,#w-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;background:linear-gradient(135deg,var(--brand),var(--brand-2));border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
.nav-wallet-btn:hover,#nav-connect:hover,#w-btn:hover{box-shadow:0 4px 15px #6f8cff55}
.nav-wallet-btn.connected,#nav-connect.connected,#w-btn.w-connected{background:transparent;border:1px solid var(--success);color:var(--success)}
.nav-wallet-display{display:none;font-size:12px;color:#8aa4ff;font-family:ui-monospace,monospace;white-space:nowrap}
.portal-nav{display:flex;align-items:center;flex-wrap:wrap;gap:12px 18px;border-bottom:1px solid #ffffff19;padding:18px 0;margin-bottom:12px}
.nav-menu-toggle{display:none;background:#151e3e;border:1px solid #3b4a79;color:#dbe3ff;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}
.nav-mobile-panel{display:none;flex-direction:column;gap:12px;width:100%;padding:14px 0 4px}
.nav-mobile-panel a{color:var(--muted);text-decoration:none;font-size:15px}
.nav-mobile-panel.open{display:flex}
.wallet-status-card{border:1px solid #2b355b;border-radius:14px;padding:16px;margin-bottom:20px;background:#0b1123}
.wallet-status-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.wallet-status-dot{width:10px;height:10px;border-radius:50%;background:#555;flex:none}
.wallet-status-label{flex:1;color:var(--muted);min-width:160px}
.wallet-status-detail{margin-top:10px;font-family:ui-monospace,monospace;font-size:13px;color:#aabbdd;word-break:break-all}
.wallet-connected{border-color:var(--success)}
.route-readiness{border:1px solid #303a5d;border-radius:12px;padding:14px 16px;margin:16px 0;background:#0b1123}
.route-readiness p{margin:8px 0 0;color:var(--muted);line-height:1.55}
.route-readiness a{color:#c6d0ff}
.route-help{font-size:14px}
.route-action-btn,.route-action-link{display:inline-flex;align-items:center;justify-content:center;margin-top:10px;padding:12px 18px;border-radius:10px;background:linear-gradient(135deg,var(--brand),var(--brand-2));border:none;color:#fff;font-weight:800;cursor:pointer;text-decoration:none}
.route-action-link{box-shadow:0 10px 35px #0004}
.route-readiness.neutral{border-color:#344273}
.route-readiness.allow{border-color:var(--success)}
.route-readiness.review{border-color:#ba91ff}
footer{border-color:#ffffff19;line-height:1.9}
@media(max-width:900px){
  .portal-nav-links{display:none}
  .nav-menu-toggle{display:inline-flex}
  .route-grid{grid-template-columns:1fr}.route-evidence{grid-column:auto}.stage-row{grid-template-columns:1fr 1fr}
  .flow-row{grid-template-columns:1fr}
  .flow-row span{min-height:60px;border-right:0;border-bottom:1px solid var(--line)}
  .flow-row span:last-child{border-bottom:0}
}
@media(max-width:760px){
  main{width:min(100% - 28px,1180px)}
  nav{min-height:72px}
  .hero,.subhero{padding:54px 0 36px}
  .product-map,.panel,.grid,.docs-grid{grid-template-columns:1fr}
  .wallet-panel,.builder-panel form{grid-template-columns:1fr}
  .builder-panel form label{grid-column:1/-1}
  .product-map{padding-bottom:0}
  .product-module{min-height:360px}
  h1,h1.compact{font-size:clamp(43px,13vw,58px)}
  .lead{font-size:17px}
  .badge{font-size:9px}
}
`;

export const guardBuilderJs = `const form=document.querySelector("#guard-builder");const result=document.querySelector("#guard-builder-result");const created=document.querySelector("#guard-created-url");const actions=document.querySelector("#guard-builder-actions");const open=document.querySelector("#guard-open");const copy=document.querySelector("#guard-copy");const share=document.querySelector("#guard-share");let currentUrl="";const show=(kind,title,message)=>{result.className="result "+kind;result.querySelector("strong").textContent=title;result.querySelector("p").textContent=message};form.addEventListener("submit",async(event)=>{event.preventDefault();actions.hidden=true;created.hidden=true;show("neutral","Creating link","Validating the declared payment intent…");const expiryHours=Number(document.querySelector("#guard-expiry-hours").value);const payload={issuer:document.querySelector("#guard-issuer").value.trim()||undefined,recipient:document.querySelector("#guard-recipient").value.trim(),amount:document.querySelector("#guard-amount").value.trim(),limit:document.querySelector("#guard-limit").value.trim(),purpose:document.querySelector("#guard-purpose").value.trim(),expires:new Date(Date.now()+expiryHours*3600000).toISOString()};try{const response=await fetch("/v1/guard-links",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const body=await response.json();if(!response.ok)throw new Error(body.message||body.error||"Could not create link");currentUrl=body.url;created.value=currentUrl;created.hidden=false;open.href=currentUrl;actions.hidden=false;show("allow","Guard Link created","The intent is time-bound and ready to review. Intent reference: "+body.intentId)}catch(error){show("error","Could not create link",error instanceof Error?error.message:"Unknown error")}});copy.addEventListener("click",async()=>{if(!currentUrl)return;try{await navigator.clipboard.writeText(currentUrl);show("allow","Link copied","The Guard Link is ready to share.")}catch{created.focus();created.select();show("review","Copy manually","Select and copy the displayed URL.")}});share.addEventListener("click",async()=>{if(!currentUrl)return;if(navigator.share){try{await navigator.share({title:"LedgerGuard payment request",url:currentUrl});return}catch{}}try{await navigator.clipboard.writeText(currentUrl);show("allow","Link copied","Native sharing was unavailable, so the link was copied.")}catch{show("review","Share manually","Copy the displayed URL.")}});`;

export const guardLinkJs = `const root=document.querySelector("#guard-wallet");const connect=document.querySelector("#connect-wallet");const send=document.querySelector("#send-payment");const verify=document.querySelector("#verify-evidence");const status=document.querySelector("#wallet-status");const output=document.querySelector("#wallet-result");const wallet=window.LedgerGuardWallet;const arcChain={chainId:"0x4cef52",chainName:"Arc Testnet",nativeCurrency:{name:"USDC",symbol:"USDC",decimals:18},rpcUrls:["https://rpc.testnet.arc.network"],blockExplorerUrls:["https://testnet.arcscan.app"]};const usdc="0x3600000000000000000000000000000000000000";let account="";let txHash="";const show=(kind,html)=>{output.hidden=false;output.className="result "+kind;output.replaceChildren();const p=document.createElement("p");p.textContent=html;output.append(p)};const units=(value)=>{const parts=value.split(".");return (BigInt(parts[0]||"0")*1000000n+BigInt(((parts[1]||"")+"000000").slice(0,6))).toString()};const data=()=>{const recipient=root.dataset.recipient.slice(2).toLowerCase().padStart(64,"0");const amount=BigInt(units(root.dataset.amount)).toString(16).padStart(64,"0");return "0xa9059cbb"+recipient+amount};const connected=()=>{const state=wallet?.getState?.()||{account:""};account=state.account||"";const declared=(root.dataset.payer||"").toLowerCase();const matches=declared&&account.toLowerCase()===declared;send.disabled=!(root.dataset.decision==="ALLOW"&&matches);status.textContent=matches?(send.disabled?"The connected wallet matches, but this intent is not allowed to proceed.":"Wallet matched. Review the exact testnet transaction before signing."):"The connected wallet does not match the declared payer."};connect.addEventListener("click",async()=>{if(!wallet){show("review","Wallet module did not load. Refresh and try again.");return}connect.disabled=true;try{await wallet.connect();await wallet.ensureChain(arcChain);const state=wallet.getState();account=state.account;const declared=root.dataset.payer||"";if(!declared||declared.toLowerCase()!==account.toLowerCase()){const url=new URL(location.href);url.searchParams.set("payer",account);location.replace(url.toString());return}connected()}catch(error){show("error",error instanceof Error?error.message:"Wallet connection failed.")}finally{connect.disabled=false}});send.addEventListener("click",async()=>{const provider=wallet?.getProvider();if(!provider||!account||root.dataset.decision!=="ALLOW")return;if(!confirm("Continue to your wallet to review a "+root.dataset.amount+" test USDC transfer?"))return;send.disabled=true;try{await wallet.ensureChain(arcChain);txHash=await provider.request({method:"eth_sendTransaction",params:[{from:account,to:usdc,data:data(),value:"0x0"}]});show("review","Transaction submitted. Wait for confirmation, then verify the onchain result.");const link=document.createElement("a");link.href="https://testnet.arcscan.app/tx/"+txHash;link.rel="noreferrer";link.target="_blank";link.textContent="Open transaction in ArcScan";output.append(link);verify.hidden=false}catch(error){show("error",error instanceof Error?error.message:"The wallet rejected or failed the transaction.");send.disabled=false}});verify.addEventListener("click",async()=>{if(!txHash)return;verify.disabled=true;show("neutral","Checking the confirmed transaction against the original intent…");try{const response=await fetch("/v1/evidence",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({network:"arcTestnet",txHash,intent:{action:"transfer",expectedDebitAddress:account,expectedRecipient:root.dataset.recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:units(root.dataset.amount),purpose:root.dataset.purpose}})});const body=await response.json();if(response.status===404){show("review","The transaction is not confirmed yet. Wait a moment and verify again.");return}if(!response.ok)throw new Error(body.message||body.error||"Evidence check failed");const kind=body.status==="VERIFIED"?"allow":body.status==="MISMATCH"?"block":"review";show(kind,body.status+": "+(body.status==="VERIFIED"?"The confirmed asset flow matches the declared payment.":"Review the evidence before treating this payment as complete."));const pre=document.createElement("pre");pre.textContent=JSON.stringify(body,null,2);output.append(pre)}catch(error){show("error",error instanceof Error?error.message:"Evidence check failed.")}finally{verify.disabled=false}});if(!wallet){connect.disabled=true;status.textContent="Wallet support did not load. Intent review remains available."}else if(root.dataset.payer){status.textContent="Reconnect the declared test wallet to enable the payment button.";void wallet.restore().then(()=>connected()).catch(()=>{})}if(root.dataset.decision==="BLOCK"){connect.disabled=true;status.textContent="This payment is blocked. Wallet handoff is disabled."}`;

export const demoJs = `const form=document.querySelector("#preflight");const result=document.querySelector("#result");const title=document.querySelector("#result-title");const summary=document.querySelector("#result-summary");const findings=document.querySelector("#result-findings");const details=document.querySelector("#result-details");const json=document.querySelector("#result-json");const usdc="0x3600000000000000000000000000000000000000";const messages={ALLOW:"The implemented checks passed. Continue only after reviewing the transaction in your wallet.",REVIEW:"Information is incomplete or an unknown condition remains. Review before proceeding.",BLOCK:"A defined risk was detected. Do not sign or send this transaction."};const clear=()=>{findings.replaceChildren();details.hidden=true;json.textContent=""};const show=(kind,heading,message)=>{result.className="result "+kind;title.textContent=heading;summary.textContent=message};const stale=(message)=>{clear();show("review","Result expired",message)};form.addEventListener("input",()=>stale("The input changed. Run the check again."));form.addEventListener("invalid",()=>stale("Correct the invalid input before running the check."),true);const units=(v)=>{if(!/^\\d+(\\.\\d{0,6})?$/.test(v))throw new Error("The amount must be a positive number with no more than 6 decimal places.");const [w,f=""]=v.split(".");const value=BigInt(w)*1000000n+BigInt((f+"000000").slice(0,6));if(value<=0n)throw new Error("The amount must be greater than zero.");return value.toString()};const address=(v,label)=>{if(!/^0x[0-9a-fA-F]{40}$/.test(v))throw new Error(label+" is not a valid EVM address.");return v};const pad=(v)=>v.slice(2).toLowerCase().padStart(64,"0");form.addEventListener("submit",async(e)=>{e.preventDefault();const button=form.querySelector("button");button.disabled=true;clear();show("neutral","Checking","Parsing the transaction and evaluating Arc Testnet policy…");try{const recipient=address(document.querySelector("#recipient").value.trim(),"Recipient address");const payerValue=document.querySelector("#payer").value.trim();const payer=payerValue?address(payerValue,"Payer public address"):"";const amount=units(document.querySelector("#amount").value.trim());const limit=units(document.querySelector("#limit").value.trim());const data="0xa9059cbb"+pad(recipient)+BigInt(amount).toString(16).padStart(64,"0");const intent={action:"transfer",expectedRecipient:recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:amount,purpose:"LedgerGuard browser demo"};if(payer)intent.expectedDebitAddress=payer;const payload={network:"arcTestnet",to:usdc,data,valueWei:"0",intent,policy:{requireSimulation:Boolean(payer),maxAmountMicroUsdc:limit}};if(payer)payload.from=payer;const response=await fetch("/v1/preflight",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const body=await response.json();if(!response.ok)throw new Error(body.message||body.error||"Request failed");show(body.decision.toLowerCase(),body.decision,messages[body.decision]||"Check completed.");for(const item of body.findings||[]){const li=document.createElement("li");li.textContent=item.code+": "+item.message;findings.append(li)}if(!body.findings?.length){const li=document.createElement("li");li.textContent="No known issue was found in the recipient, asset, amount, payer, or simulation.";findings.append(li)}json.textContent=JSON.stringify(body,null,2);details.hidden=false}catch(error){show("error","Check failed",error instanceof Error?error.message:"Unknown error");}finally{button.disabled=false}});`;

export const developerConsoleJs = `const registerForm=document.querySelector("#developer-register");const loginForm=document.querySelector("#developer-login");const keyInput=document.querySelector("#developer-key");const result=document.querySelector("#developer-result");const title=document.querySelector("#developer-title");const summary=document.querySelector("#developer-summary");const actions=document.querySelector("#developer-actions");const details=document.querySelector("#developer-details");const output=document.querySelector("#developer-json");const runButton=document.querySelector("#developer-run");const rotateButton=document.querySelector("#developer-rotate");const copyButton=document.querySelector("#developer-copy");let apiKey=sessionStorage.getItem("ledgerguard.test.apiKey")||"";if(apiKey)keyInput.value=apiKey;const show=(kind,heading,message,data)=>{result.className="result "+kind;title.textContent=heading;summary.textContent=message;if(data){output.textContent=JSON.stringify(data,null,2);details.hidden=false}else{output.textContent="";details.hidden=true}};const remember=(value)=>{apiKey=value;keyInput.value=value;sessionStorage.setItem("ledgerguard.test.apiKey",value);actions.hidden=false};const request=async(path,options={})=>{const headers={...(options.headers||{})};if(apiKey)headers.authorization="Bearer "+apiKey;const response=await fetch(path,{...options,headers});const body=await response.json().catch(()=>({error:"INVALID_RESPONSE"}));if(!response.ok){const error=new Error(body.message||body.error||"Request failed");error.body=body;throw error}return body};const load=async()=>{const body=await request("/v1/developer/account");actions.hidden=false;show("allow","Account loaded",body.usage.used+" of "+body.usage.limit+" testnet units used this month.",body)};registerForm.addEventListener("submit",async(event)=>{event.preventDefault();show("neutral","Creating account","Allocating a revocable test key in the durable store…");try{const body=await request("/v1/developer/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:document.querySelector("#developer-name").value.trim()})});remember(body.apiKey);show("allow","Test API key created","Save the key now. It is displayed only once by the service.",body);actions.hidden=false}catch(error){show("error","Registration failed",error.message,error.body)}});loginForm.addEventListener("submit",async(event)=>{event.preventDefault();remember(keyInput.value.trim());try{await load()}catch(error){actions.hidden=true;show("error","Could not load account",error.message,error.body)}});runButton.addEventListener("click",async()=>{show("neutral","Running metered check","Recording one unit and evaluating a deterministic Arc Testnet request…");const recipient="0x2222222222222222222222222222222222222222";const usdc="0x3600000000000000000000000000000000000000";const data="0xa9059cbb"+recipient.slice(2).padStart(64,"0")+"00000000000000000000000000000000000000000000000000000000000f4240";try{const body=await request("/v1/developer/preflight",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({network:"arcTestnet",to:usdc,data,valueWei:"0",intent:{action:"transfer",expectedRecipient:recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:"1000000",purpose:"Developer console metered test"},policy:{requireSimulation:false,maxAmountMicroUsdc:"1000000"}})});show(body.decision==="BLOCK"?"block":"review","Metered preflight: "+body.decision,"Usage was recorded in the durable ledger.",body)}catch(error){show("error","Metered request failed",error.message,error.body)}});rotateButton.addEventListener("click",async()=>{if(!confirm("Rotate this API key? The current key will stop working immediately."))return;try{const body=await request("/v1/developer/keys/rotate",{method:"POST"});remember(body.apiKey);show("allow","API key rotated","The previous key is revoked. Save the replacement now.",body)}catch(error){show("error","Key rotation failed",error.message,error.body)}});copyButton.addEventListener("click",async()=>{if(!apiKey)return;try{await navigator.clipboard.writeText(apiKey);show("allow","API key copied","The current test key was copied to the clipboard.")}catch{show("error","Copy failed","Copy the key manually from the key field.")}});`;
