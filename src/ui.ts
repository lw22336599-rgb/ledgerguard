const brandAssetVersion = "5";
const brandMarkSrc = `/brand/logo-64.png?v=${brandAssetVersion}`;

const pageHead = (title: string, description: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <link rel="icon" href="/favicon.png?v=${brandAssetVersion}" type="image/png">
  <link rel="icon" href="/favicon.svg?v=${brandAssetVersion}" type="image/svg+xml">
  <link rel="shortcut icon" href="/favicon.ico?v=${brandAssetVersion}" type="image/png">
  <link rel="apple-touch-icon" href="/brand/logo-192.png?v=${brandAssetVersion}">
  <link rel="stylesheet" href="/styles.css">
  <script defer src="/_vercel/insights/script.js"></script>
</head>`;

const arcPrimaryEyebrow = "USDC PAYMENT LINKS · ARC TESTNET";
const portalHeroNetworkNoteHtml =
  "Guard Links use <strong>Arc Testnet</strong> USDC (no real money).";
const baseMainnetLinkLabel = "Base x402 demo";
const specDocsBase =
  "https://github.com/lw22336599-rgb/ledgerguard/blob/main/docs";
/** Legacy demo default; never a real contract — wallet connect replaces this. */
export const guardRecipientDemoDefault =
  "0x2222222222222222222222222222222222222222";

const footer = `<footer class="site-footer">
  <div class="footer-primary">LedgerGuard &middot; Payment intent safety &middot; Arc Testnet Guard Links</div>
  <div class="footer-links"><a href="/guard/create">Get paid</a> &middot; <a href="/pay">Pay a link</a> &middot; <a href="/payments">Check payments</a> &middot; <a href="/docs">Developers</a> &middot; <a href="/status">Status</a> &middot; <a href="/testnet-help">Wallet setup</a> &middot; <a href="/about">About</a> &middot; <a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a> &middot; <a href="https://testnet.arcscan.app" rel="noreferrer">ArcScan</a> &middot; <a href="mailto:lw22336599@gmail.com">Email</a> &middot; <a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">GitHub</a></div>
  <div class="footer-partners">Compatible with <a href="https://x402.org" rel="noreferrer">x402</a> &middot; <a href="https://www.circle.com/en/arc" rel="noreferrer">Arc</a> &middot; <a href="/canary">${baseMainnetLinkLabel}</a></div>
  <div class="footer-social"><a href="https://x.com/HuiLibaa" rel="me noreferrer">Follow on X @HuiLibaa</a></div>
</footer>`;

const portalNavLinks = `<a href="/guard/create">Get paid</a><a href="/pay">Pay a link</a>`;

export function portalNavHtml(
  badge = "ARC TESTNET",
  options?: { danger?: boolean },
): string {
  const badgeClass = options?.danger ? "badge danger" : "badge";
  return `<nav class="portal-nav">
      <a class="brand" href="/"><img class="brand-mark" src="${brandMarkSrc}" alt="" width="44" height="44" decoding="async">LedgerGuard</a>
      <button id="nav-menu-toggle" class="nav-menu-toggle" type="button" aria-expanded="false" aria-controls="nav-mobile-panel">Menu</button>
      <div class="portal-nav-links">${portalNavLinks}</div>
      <div id="nav-mobile-panel" class="nav-mobile-panel" aria-label="Mobile navigation">${portalNavLinks}</div>
      <div class="portal-nav-actions">
        <button id="nav-connect" class="nav-wallet-btn" type="button">Connect Wallet</button>
        <span id="nav-wallet-display" class="nav-wallet-display"></span>
        <span class="${badgeClass}">${badge}</span>
      </div>
    </nav>`;
}

export function portalPageScripts(...extraScripts: string[]): string {
  const extras = extraScripts
    .map((source) => `\n  <script src="${source}" defer></script>`)
    .join("");
  return `\n  <script src="/wallet.js" defer></script>\n  <script src="/site-nav.js" defer></script>${extras}`;
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
      ? "The checks passed. Review the exact wallet transaction before signing."
      : input.decision === "BLOCK"
        ? "A policy risk was detected. Do not sign or send this payment."
        : "Connect your wallet or review the details before paying.";
  return `${pageHead(
    "LedgerGuard | Payment request",
    "Review a USDC payment request on Arc Testnet before approving it in your wallet.",
  )}
<body>
  <main>
    ${portalNavHtml("PAY REQUEST")}
    <section class="subhero">
      <p class="eyebrow">NO CUSTODY &middot; YOU APPROVE IN YOUR WALLET</p>
      <h1 class="compact">Payment request</h1>
      <p class="lead">Check who gets paid, how much USDC moves, and why—before you approve.</p>
    </section>
    <section class="preflight-status-bar result ${input.decision.toLowerCase()}" aria-live="polite">
      <p class="step">PREFLIGHT CHECK</p>
      <strong>${escapeHtml(decisionLabel)}</strong>
      <p>${escapeHtml(decisionSummary)}</p>
      <p class="muted">Fields checked against the declared payment request. Sender identity is <strong>not</strong> independently verified.</p>
    </section>
    <section id="payment-complete" class="payment-complete" hidden aria-live="polite">
      <p class="step">PAYMENT COMPLETE</p>
      <h2 class="payment-complete-title">Payment complete</h2>
      <p class="payment-complete-line">You paid <strong id="complete-amount">0 USDC</strong></p>
      <p class="payment-complete-line">To <strong id="complete-recipient">recipient</strong></p>
      <p class="payment-complete-line">Transaction <a id="complete-tx" href="#" rel="noreferrer" target="_blank">View on ArcScan</a></p>
    </section>
    <section class="panel">
      <div>
        <p class="step">PAYMENT DETAILS</p>
        <dl>${fields.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl>
      </div>
      <section class="result ${input.decision.toLowerCase()}">
        <strong>${escapeHtml(decisionLabel)}</strong>
        <p>${escapeHtml(decisionSummary)}</p>
        <details><summary>Payment receipt details</summary>
          <p class="muted">Technical status: <code>${escapeHtml(input.decision)}</code></p>
          <ul>${input.findings.map((finding) => `<li><strong>${escapeHtml(finding.code)}</strong>: ${escapeHtml(finding.message)}</li>`).join("")}</ul>
          <p>Reference: <code>${escapeHtml(input.requestId)}</code></p>
        </details>
      </section>
    </section>
    <section id="guard-wallet"
      class="wallet-panel"
      data-decision="${escapeHtml(input.decision)}"
      data-issuer="${escapeHtml(input.issuer ?? "")}"
      data-payer="${escapeHtml(input.payer === "Not declared" ? "" : input.payer)}"
      data-recipient="${escapeHtml(input.recipient)}"
      data-amount="${escapeHtml(input.amount)}"
      data-purpose="${escapeHtml(input.purpose)}">
      <div>
        <p class="step">APPROVE PAYMENT</p>
        <h2>Pay in your wallet</h2>
        <p id="wallet-status" class="muted">LedgerGuard never sees your private key. Your wallet shows the exact transaction before you approve.</p>
      </div>
      <div class="wallet-buttons">
        <button id="connect-wallet" type="button" class="secondary">Connect wallet</button>
        <button id="send-payment" type="button" disabled>Approve payment</button>
        <button id="verify-evidence" type="button" class="secondary" hidden>Confirm payment complete</button>
      </div>
      <section id="wallet-result" class="result neutral" hidden aria-live="polite"></section>
    </section>
    <section id="guard-cta" class="guard-cta">
      <p class="step">POWERED BY LEDGERGUARD</p>
      <h2>Get paid with USDC too</h2>
      <p id="guard-cta-summary" class="muted">Create your own payment link in under a minute. No account required.</p>
      <a id="guard-cta-link" class="button-link" href="/guard/create">Create your payment link</a>
    </section>
    <section class="notice"><strong>Testnet only:</strong> Arc Testnet assets have no financial value. A sender name is self-declared context, not verified identity.</section>
    <div class="links bottom-links"><a href="/guard/create">Get paid</a><a href="/pay">Pay a link</a><a href="/payments">Check payments</a><a href="/testnet-help#arc">Wallet setup</a></div>
    ${footer}
  </main>${portalPageScripts("/guard.js")}
</body>
</html>`;
}

export const guardBuilderHtml = `${pageHead(
  "LedgerGuard | Create a payment link",
  "Create a USDC payment link on Arc Testnet. Share the link or QR so the payer reviews before approving.",
)}
<body>
  <main>
    ${portalNavHtml("GET PAID")}
    <section class="subhero">
      <p class="eyebrow">${arcPrimaryEyebrow}</p>
      <h1 class="compact">Create a payment link.</h1>
      <p class="lead">Connect your wallet, enter the amount, and share the link or QR code. They review who gets paid before approving.</p>
      <p class="portal-network-note">${portalHeroNetworkNoteHtml}</p>
    </section>
    <section id="guard-verified-notice" class="notice" hidden><strong>Welcome back.</strong> Your receiving address is prefilled from your verified payment. Connect the same wallet or edit the address before creating a link.</section>
    <section class="panel builder-panel">
      <div class="chain-selector-row">
        <div class="chain-network-active">
          <span class="chain-network-label">Network</span>
          <strong id="guard-chain-label">Arc Testnet</strong>
        </div>
      </div>
      <div id="wallet-section" class="wallet-status-card">
        <div class="wallet-status-row">
          <div id="w-dot" class="wallet-status-dot"></div>
          <span id="w-status" class="wallet-status-label">No wallet connected</span>
          <button id="w-btn" type="button" class="nav-wallet-btn">Connect Wallet</button>
        </div>
        <div id="w-detail" class="wallet-status-detail" hidden></div>
        <p class="field-help">No wallet yet? <a href="/testnet-help#arc">5-minute setup guide</a> &middot; <a href="/payments">Check incoming payments</a></p>
      </div>
      <p class="step">QUICK START</p>
      <div class="template-chips" role="group" aria-label="Payment templates">
        <button type="button" class="template-chip" data-amount="50.00" data-purpose="Freelance invoice">Freelance invoice</button>
        <button type="button" class="template-chip" data-amount="19.99" data-purpose="Product sale">Product sale</button>
        <button type="button" class="template-chip" data-amount="1200.00" data-purpose="Rent share">Rent share</button>
        <button type="button" class="template-chip" data-amount="5.00" data-purpose="Tip or thanks">Tip or thanks</button>
      </div>
      <form id="guard-builder">
        <label>Your name (optional)<input id="guard-issuer" name="issuer" maxlength="80" placeholder="Example: Alex or your shop name"></label>
        <label>Your receiving address<input id="guard-recipient" name="recipient" value="" required pattern="0x[0-9a-fA-F]{40}" placeholder="Connect wallet above to auto-fill, or paste 0x…" autocomplete="off" aria-describedby="guard-recipient-help"><span id="guard-recipient-help" class="field-help">This is where USDC will be sent. Connect your wallet to fill it automatically.</span></label>
        <label>Amount to receive (USDC)<input id="guard-amount" name="amount" value="1.00" required inputmode="decimal" pattern="(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,6})?"></label>
        <label>What is this payment for?<input id="guard-purpose" name="purpose" value="Example invoice" required maxlength="120"></label>
        <details class="builder-advanced">
          <summary>Advanced options</summary>
          <div class="builder-advanced-grid">
            <label>Maximum allowed (USDC)<input id="guard-limit" name="limit" value="1.00" required inputmode="decimal" pattern="(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,6})?"></label>
            <label>Link expires in hours<input id="guard-expiry-hours" name="expiryHours" value="24" required type="number" min="1" max="168" step="1"></label>
          </div>
        </details>
        <button type="submit">Create payment link</button>
      </form>
      <section id="guard-builder-result" class="result neutral" aria-live="polite">
        <strong>Ready</strong>
        <p>Create a time-bound payment link. No private key is stored on the server.</p>
        <input id="guard-created-url" readonly hidden aria-label="Created Guard Link">
        <div id="guard-qr-wrap" class="guard-qr-wrap" hidden>
          <p class="step">SCAN OR SCREENSHOT</p>
          <canvas id="guard-qr-canvas" width="200" height="200" aria-label="QR code for payment link"></canvas>
        </div>
        <div id="guard-builder-actions" class="wallet-buttons" hidden>
          <button id="guard-copy" type="button" class="secondary">Copy link</button>
          <button id="guard-share" type="button" class="secondary">Share</button>
          <a id="guard-open" class="button-link" href="/guard/create">Preview link</a>
        </div>
      </section>
    </section>
    <section class="notice"><strong>Identity boundary:</strong> the sender name is self-declared. It is not proof that a company or domain authorized the request. LedgerGuard still binds and checks the exact payment fields.</section>
    ${footer}
  </main>${portalPageScripts("/guard-builder.js", "/guard-builder-wallet.js")}
</body>
</html>`;

export const testnetHelpHtml = `${pageHead(
  "LedgerGuard | Wallet setup guide",
  "Install a wallet and fund Arc Testnet USDC for Guard Links.",
)}
<body>
  <main>
    ${portalNavHtml("WALLET SETUP")}
    <section class="subhero">
      <p class="eyebrow">NO REAL FUNDS &middot; TESTNET ONLY</p>
      <h1 class="compact">Set up your wallet for LedgerGuard.</h1>
      <p class="lead">Guard Links run on Arc Testnet. Install an EVM wallet, request test USDC, then create or pay a link.</p>
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
      </div>
      <section id="guide-arc" class="guide-track">
        <p class="step">GUARD LINKS &middot; ARC TESTNET</p>
        <h2>Fund Arc Testnet USDC</h2>
        <p class="muted">This is the primary path for creating and paying Guard Links.</p>
        <section id="fund-arc-balances" class="route-readiness neutral" aria-live="polite">
          <strong>Arc Testnet USDC</strong>
          <p>Connect a wallet to read your Arc Testnet balance.</p>
        </section>
        <section class="docs-grid">
          <article class="doc-card"><span>STEP 1</span><h2>Install MetaMask</h2><p>LedgerGuard connects through your browser wallet. We never receive your private key.</p><a href="https://metamask.io/download/" rel="noreferrer" target="_blank">Download MetaMask</a></article>
          <article class="doc-card"><span>STEP 2</span><h2>Get test USDC</h2><p>Circle sends test USDC on Arc Testnet. Select <strong>Arc Testnet</strong> in the faucet.</p><a href="https://faucet.circle.com/" rel="noreferrer" target="_blank">Circle testnet faucet</a></article>
          <article class="doc-card"><span>STEP 3</span><h2>Create a Guard Link</h2><p>Connect the funded wallet, enter the amount, and share the link or QR code.</p><a href="/guard/create">Create a Guard Link</a></article>
        </section>
      </section>
    </section>
    <section class="notice"><strong>Why faucets fail:</strong> Faucets often require mainnet activity, verified accounts, or regional eligibility. If Circle shows “Limit Exceeded”, wait 2 hours or try another wallet. Email <a href="mailto:lw22336599@gmail.com">lw22336599@gmail.com</a> with your public address if you are blocked during testing.</section>
    ${footer}
  </main>
  <script src="/wallet.js" defer></script>
  <script src="/testnet-help.js" defer></script>
  <script src="/site-nav.js" defer></script>
</body>
</html>`;

export const paymentsHtml = `${pageHead(
  "LedgerGuard | Check payments",
  "View Arc Testnet payment history onchain or verify a Guard Link transaction hash without storing funds on LedgerGuard.",
)}
<body>
  <main>
    ${portalNavHtml("CHECK PAYMENTS")}
    <section class="subhero">
      <p class="eyebrow">NON-CUSTODIAL &middot; ONCHAIN PROOF</p>
      <h1 class="compact">Check whether a payment arrived.</h1>
      <p class="lead">LedgerGuard does not hold your funds or keep a private payment ledger. Use your public address on ArcScan, or verify a transaction hash against the declared Guard Link details.</p>
    </section>
    <section class="panel developer-panel">
      <div>
        <p class="step">RECEIVING ADDRESS</p>
        <h2>View onchain history</h2>
        <p class="muted">Open ArcScan for any Arc Testnet address to see incoming USDC transfers.</p>
        <form id="payments-address-form">
          <label>Your receiving address<input id="payments-address" required pattern="0x[0-9a-fA-F]{40}" placeholder="0x…" autocomplete="off"></label>
          <button type="submit">Open ArcScan history</button>
        </form>
        <section id="payments-address-result" class="result neutral" hidden aria-live="polite"></section>
      </div>
      <div>
        <p class="step">TRANSACTION HASH</p>
        <h2>Verify a Guard Link payment</h2>
        <p class="muted">Paste the transaction hash and the payment details from the Guard Link you shared or received.</p>
        <form id="payments-verify-form">
          <label>Transaction hash<input id="payments-tx" required pattern="0x[0-9a-fA-F]{64}" placeholder="0x…" autocomplete="off" spellcheck="false"></label>
          <label>Recipient address<input id="payments-recipient" required pattern="0x[0-9a-fA-F]{40}" placeholder="0x…" autocomplete="off"></label>
          <label>Amount (USDC)<input id="payments-amount" required inputmode="decimal" pattern="(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,6})?" placeholder="1.00"></label>
          <label>Payer address (optional)<input id="payments-payer" pattern="0x[0-9a-fA-F]{40}" placeholder="0x…" autocomplete="off"></label>
          <label>Purpose (optional)<input id="payments-purpose" maxlength="120" placeholder="Example invoice"></label>
          <button type="submit">Verify onchain result</button>
        </form>
        <section id="payments-verify-result" class="result neutral" hidden aria-live="polite"></section>
      </div>
    </section>
    <section class="notice"><strong>Privacy:</strong> Verification uses public Arc Testnet data only. LedgerGuard stores neither your address history nor wallet balances on this page.</section>
    <div class="links bottom-links"><a href="/guard/create">Get paid</a><a href="/pay">Pay a link</a><a href="/testnet-help#arc">Wallet setup</a><a href="https://testnet.arcscan.app" rel="noreferrer">Open ArcScan</a></div>
    ${footer}
  </main>${portalPageScripts("/payments.js")}
</body>
</html>`;

export const payHtml = `${pageHead(
  "LedgerGuard | Pay with USDC",
  "Open a payment link you received. Review amount and recipient before approving in your wallet.",
)}
<body>
  <main>
    ${portalNavHtml("PAY")}
    <section class="subhero">
      <p class="eyebrow">PAY A LINK · ARC TESTNET</p>
      <h1 class="compact">Pay with USDC</h1>
      <p class="lead">Paste the payment link someone sent you. You will review who gets paid and how much before approving.</p>
    </section>
    <section class="panel">
      <form id="pay-form">
        <label>Payment link<input id="pay-url" name="url" required placeholder="https://…/guard?…" autocomplete="off" spellcheck="false"></label>
        <button type="submit">Open payment</button>
      </form>
      <div id="pay-recent-wrap" class="pay-recent-wrap" hidden>
        <button id="pay-recent" type="button" class="secondary">Open last payment link</button>
      </div>
      <section id="pay-result" class="result neutral" hidden aria-live="polite"></section>
    </section>
    <section class="notice"><strong>Testnet:</strong> Arc Testnet USDC has no real money value.</section>
    <div class="links bottom-links"><a href="/guard/create">Get paid</a><a href="/testnet-help#arc">Wallet setup</a></div>
    ${footer}
  </main>${portalPageScripts("/pay.js")}
</body>
</html>`;

export const portalHtml = `${pageHead(
  "LedgerGuard | Payment intent safety",
  "Non-custodial stablecoin payment intent safety on Arc Testnet. Review amount, recipient, and purpose before you sign.",
)}
<body>
  <main>
    ${portalNavHtml()}
    <section class="hero portal-hero">
      <div class="portal-hero-grid">
        <div class="portal-hero-copy">
          <p class="eyebrow">${arcPrimaryEyebrow}</p>
          <h1>Send and receive USDC<br><span>with a simple link.</span></h1>
          <p class="lead">Payment intent safety: check who gets paid, how much, and why before you approve. No signup. Non-custodial.</p>
          <p class="portal-network-note">${portalHeroNetworkNoteHtml}</p>
          <div class="portal-actions portal-dual-cta">
            <a class="primary-action portal-primary-cta" href="/guard/create">Get paid</a>
            <a class="secondary-action portal-secondary-cta" href="/pay">Pay a link</a>
          </div>
          <p class="portal-trust-list"><a href="#how-it-works">New here? How it works</a> &middot; <a href="/testnet-help#arc">No wallet yet?</a></p>
        </div>
        <figure class="portal-hero-visual">
          <img src="/marketing/hero-guard-builder.png" alt="Payment link builder with QR code" width="640" height="360" loading="eager">
        </figure>
      </div>
    </section>
    <section id="how-it-works" class="how-it-works" aria-label="How it works">
      <p class="eyebrow">HOW IT WORKS</p>
      <h2 class="compact">Three steps — about 30 seconds.</h2>
      <div class="how-steps">
        <article class="how-step-card">
          <img src="/marketing/step-create.png" alt="Connect wallet and enter amount" width="400" height="250" loading="lazy">
          <p class="step">STEP 1</p>
          <h3>Connect wallet</h3>
          <p class="muted">Use MetaMask or another wallet. Takes about two minutes the first time.</p>
        </article>
        <article class="how-step-card">
          <img src="/marketing/step-payment.png" alt="Share payment link" width="400" height="250" loading="lazy">
          <p class="step">STEP 2</p>
          <h3>Enter amount</h3>
          <p class="muted">Set how much USDC you want to receive and what it is for.</p>
        </article>
        <article class="how-step-card">
          <img src="/marketing/step-verified.png" alt="Payment complete" width="400" height="250" loading="lazy">
          <p class="step">STEP 3</p>
          <h3>Share the link</h3>
          <p class="muted">Send the link or QR code. They pay, you receive USDC onchain.</p>
        </article>
      </div>
      <section class="faq-panel">
        <h3>Common questions</h3>
        <dl class="faq-list">
          <dt>What is USDC?</dt><dd>A digital dollar stablecoin. On Arc Testnet it has no real money value.</dd>
          <dt>What is a wallet?</dt><dd>Your account for crypto — like a login for payments.</dd>
          <dt>Do I need to be a developer?</dt><dd>No. It works like a payment app.</dd>
        </dl>
      </section>
    </section>
    ${footer}
  </main>${portalPageScripts()}
</body>
</html>`;

export const integrationsHtml = `${pageHead(
  "LedgerGuard | Integrations",
  "Public integration registry and attribution guidance for LedgerGuard preflight and evidence APIs.",
)}
<body>
  <main>
    ${portalNavHtml("INTEGRATIONS")}
    <section class="subhero">
      <p class="eyebrow">ATTRIBUTION &middot; FREE TESTNET TIER</p>
      <h1 class="compact">Integration registry</h1>
      <p class="lead">LedgerGuard counts an integration only after a public project identity, reproducible request IDs, and completed API calls are submitted through our GitHub issue template.</p>
    </section>
    <section class="panel developer-panel">
      <div>
        <p class="step">HOW TO APPEAR HERE</p>
        <h2>Register an integration id</h2>
        <ol>
          <li>Install <code>@ledgerguard1/sdk</code> or call <code>POST /v1/can-sign</code>.</li>
          <li>Send a non-secret <code>X-LedgerGuard-Integration</code> header, for example <code>acme-agent-testnet</code>.</li>
          <li>Save response <code>X-LedgerGuard-Request-Id</code> values or public testnet transaction hashes.</li>
          <li>Open the <code>Independent integration evidence</code> GitHub issue in the repository.</li>
        </ol>
        <p class="muted">Current public verified integrations: <strong>0</strong>. Testnet usage is free and has no financial value.</p>
      </div>
      <div>
        <p class="step">RECOMMENDED STACK</p>
        <h2>Where LedgerGuard fits</h2>
        <ul>
          <li>Optional CI gate tools scan payment code paths.</li>
          <li>Optional x402 endpoint readiness checks run before agents pay URLs.</li>
          <li><strong>LedgerGuard validates declared stablecoin intent against unsigned calldata.</strong></li>
          <li>Payment rails such as x402 facilitators settle USDC.</li>
          <li>LedgerGuard evidence reconciles the finalized transaction.</li>
        </ul>
        <a href="/docs/integration-stack">Read INTEGRATION_STACK.md</a>
      </div>
    </section>
    ${footer}
  </main>${portalPageScripts()}
</body>
</html>`;

export const integrationStackHtml = `${pageHead(
  "LedgerGuard | Integration stack",
  "Recommended payment safety stack for Arc USDC, x402 sellers, and Guard Links.",
)}
<body>
  <main>
    ${portalNavHtml("INTEGRATION STACK")}
    <section class="subhero">
      <p class="eyebrow">DEVELOPER GUIDE</p>
      <h1 class="compact">Integration stack</h1>
      <p class="lead">LedgerGuard is the stablecoin intent and evidence layer. It complements payment apps and x402 facilitators; it does not replace them.</p>
    </section>
    <section class="panel">
      <pre>CI / code gate (optional)
  -&gt; x402 endpoint readiness (optional)
  -&gt; LedgerGuard preflight / can-sign
  -&gt; wallet signature or x402 settlement
  -&gt; LedgerGuard evidence</pre>
      <p class="muted">Install: <code>npm install @ledgerguard1/sdk</code>. Free endpoints: <code>POST /v1/preflight</code>, <code>POST /v1/can-sign</code>, <code>POST /v1/evidence</code>.</p>
      <p class="muted">Specifications: <a href="${specDocsBase}/PREFLIGHT_RECORD_MAPPING.md" rel="noreferrer">x402 mapping</a> · <a href="${specDocsBase}/NETWORK_ADAPTER_SPEC.md" rel="noreferrer">adapters</a> · <a href="${specDocsBase}/GUARD_LINK_FORMAT.md" rel="noreferrer">Guard Links</a> · <a href="${specDocsBase}/OPEN_SOURCE_POLICY.md" rel="noreferrer">open source policy</a></p>
      <p class="muted">Enabled networks are published at <a href="/v1/network-adapters">/v1/network-adapters</a>. Unsupported networks fail closed.</p>
    </section>
    ${footer}
  </main>${portalPageScripts()}
</body>
</html>`;

export const developerDocsHtml = `${pageHead(
  "LedgerGuard | Developer Documentation",
  "Human-readable documentation for the LedgerGuard payment intent safety API.",
)}
<body>
  <main>
    ${portalNavHtml("DEVELOPER DOCS")}
    <section class="subhero">
      <p class="eyebrow">HUMAN-READABLE DEVELOPER ENTRY</p>
      <h1 class="compact">API documentation</h1>
      <p class="lead">Non-custodial stablecoin intent safety: preflight before sign, evidence after settlement. This page is for people; machines use the <a href="/openapi.json">OpenAPI JSON</a> machine-readable file.</p>
    </section>
    <section class="docs-grid">
      <article class="doc-card"><span>POST</span><h2>/v1/preflight</h2><p>Parse, compare, and simulate an unsigned transaction before signing. Returns ALLOW, REVIEW, or BLOCK.</p></article>
      <article class="doc-card"><span>POST</span><h2>/v1/can-sign</h2><p>Thin wallet path: recipient, amount, purpose, and calldata.</p></article>
      <article class="doc-card"><span>POST</span><h2>/v1/evidence</h2><p>After confirmation, reconcile payer, recipient, asset, amount, and unexpected side effects.</p></article>
    </section>
    <section class="panel developer-panel">
      <div>
        <p class="step">COMPATIBLE STANDARDS</p>
        <h2>x402 and specifications</h2>
        <p class="muted">LedgerGuard complements x402 facilitators and endpoint readiness tools. We map to the draft <a href="https://github.com/x402-foundation/x402/pull/2792" rel="noreferrer">x402 Payment Preflight Record</a> as a compatible oracle — we do not own the x402 specification.</p>
        <ul>
          <li><a href="${specDocsBase}/PREFLIGHT_RECORD_MAPPING.md" rel="noreferrer">Preflight Record mapping</a></li>
          <li><a href="${specDocsBase}/NETWORK_ADAPTER_SPEC.md" rel="noreferrer">Network adapter spec</a></li>
          <li><a href="${specDocsBase}/GUARD_LINK_FORMAT.md" rel="noreferrer">Guard Link format</a></li>
          <li><a href="${specDocsBase}/OPEN_SOURCE_POLICY.md" rel="noreferrer">Open source policy</a></li>
          <li><a href="${specDocsBase}/WALLET_EXCHANGE_INTEGRATION.md" rel="noreferrer">Wallet / exchange integration</a></li>
        </ul>
      </div>
      <div>
        <p class="step">SDK</p>
        <h2>npm package</h2>
        <p class="muted"><code>npm install @ledgerguard1/sdk</code> — see <a href="/docs/integration-stack">integration stack</a> and GitHub <code>examples/</code>.</p>
      </div>
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
  </main>${portalPageScripts()}
</body>
</html>`;

export const mainnetCanaryHtml = `${pageHead(
  "LedgerGuard | Base Mainnet x402",
  "Pay 0.001 USDC on Base Mainnet through live x402 settlement. All production activation gates passed.",
)}
<body>
  <main>
    ${portalNavHtml("BASE MAINNET LIVE")}
    <section class="subhero">
      <p class="eyebrow">REAL USDC · X402 · PRODUCTION READY</p>
      <h1 class="compact">Pay with Base Mainnet USDC.</h1>
      <p class="lead">Connect a Base Mainnet wallet with USDC and ETH for gas. LedgerGuard runs live x402 settlement on Base (0.001 USDC) and delivers a strict evidence receipt. All production gates are enabled and operational.</p>
      <p class="lead"><strong>Important:</strong> do not use the settlement recipient wallet (<code>0xA0Fef5…Ca0b9</code>) as the payer. Use a different Base Mainnet account that holds USDC and ETH for gas.</p>
    </section>
    <section class="panel builder-panel">
      <div class="wallet-buttons">
        <button id="canary-switch" type="button" class="secondary">Switch to Base Mainnet</button>
        <button id="canary-connect" type="button" class="secondary">Connect Base wallet</button>
        <button id="canary-pay" type="button" disabled>Pay 0.001 USDC on Base Mainnet</button>
      </div>
      <p id="canary-status" class="muted">Start by switching MetaMask from Base Sepolia to Base Mainnet. LedgerGuard never receives your private key.</p>
      <section id="canary-result" class="result neutral" hidden aria-live="polite"></section>
    </section>
    <section class="notice"><strong>Real funds:</strong> this charges 0.001 USDC on Base Mainnet plus gas. It is not a testnet faucet flow.</section>
    ${footer}
  </main>
  <script src="/wallet.js" defer></script>
  <script src="/site-nav.js" defer></script>
  <script src="/mainnet-canary.js" defer></script>
</body>
</html>`;

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
    ${portalNavHtml("PUBLIC TEST")}
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
  </main>${portalPageScripts()}
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
    ${portalNavHtml(available ? "TESTNET SELF-SERVICE" : "SETUP PENDING", {
      danger: !available,
    })}
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
  </main>${portalPageScripts("/developer.js")}
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
    ${portalNavHtml(input.ready ? "OPERATIONAL" : "DEGRADED")}
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
  </main>${portalPageScripts()}
</body>
</html>`;
}

export const integrationBoundaryHtml = `${pageHead(
  "LedgerGuard | Integration Boundary",
  "LedgerGuard safety decisions, custody boundaries, and mainnet controls.",
)}
<body>
  <main>
    ${portalNavHtml("SAFETY BOUNDARY")}
    <section class="subhero"><p class="eyebrow">INTEGRATION SAFETY BOUNDARY</p><h1 class="compact">What the system does — and never does</h1></section>
    <section class="docs-grid">
      <article class="doc-card"><span>DOES</span><h2>Inspect and reconcile</h2><p>Parse supported calls, run read-only simulation, match declared intent, and return a reviewable evidence summary.</p></article>
      <article class="doc-card"><span>NEVER</span><h2>Touch private keys</h2><p>Never request private keys or recovery phrases, custody assets, sign for a wallet, or initiate a real transaction automatically.</p></article>
      <article class="doc-card"><span>FAIL CLOSED</span><h2>Unknown means no ALLOW</h2><p>Unknown calls, failed simulation, network mismatch, or unapproved mainnet configuration never produce a conclusion that is safe to sign.</p></article>
    </section>
    <section class="notice"><strong>Important:</strong> LedgerGuard is an additional safety layer. It does not replace wallet confirmation, contract audits, organizational approval, or the user's final judgment.</section>
    ${footer}
  </main>${portalPageScripts()}
</body>
</html>`;

function legalPageHtml(
  title: string,
  description: string,
  bodyHtml: string,
): string {
  return `${pageHead(`LedgerGuard | ${title}`, description)}
<body>
  <main>
    ${portalNavHtml("LEGAL")}
    <section class="subhero legal-hero">
      <p class="eyebrow">LEGAL</p>
      <h1 class="compact">${title}</h1>
      <p class="lead">Last updated: July 31, 2026. English is the authoritative version for the public product.</p>
    </section>
    <section class="legal-prose panel">
      ${bodyHtml}
    </section>
    ${footer}
  </main>${portalPageScripts()}
</body>
</html>`;
}

export const privacyHtml = legalPageHtml(
  "Privacy Policy",
  "How LedgerGuard handles wallet connections, server logs, and analytics on the public demo site.",
  `<h2>Summary</h2>
      <p>LedgerGuard is a non-custodial payment safety demo. We do not ask for, store, or process private keys, seed phrases, or wallet signing authority.</p>
      <h2>What runs in your browser</h2>
      <p>When you connect a wallet, the browser extension (for example MetaMask) holds your keys locally. LedgerGuard only receives the public address and network information needed to show status or prepare an unsigned transaction for you to review.</p>
      <h2>What the service stores</h2>
      <ul>
        <li><strong>Developer API keys:</strong> if you register for the public developer console, a revocable test API key and usage counters may be stored in the configured durable store (for example Upstash Redis).</li>
        <li><strong>Operational logs:</strong> standard request metadata (path, status, duration, request ID) may appear in hosting logs (for example Vercel) for reliability and abuse prevention.</li>
        <li><strong>Onchain data:</strong> public blockchain transactions you choose to broadcast remain public by design.</li>
      </ul>
      <h2>Analytics</h2>
      <p>Human-readable pages may load privacy-preserving production analytics from the hosting provider. We do not use those analytics to sell personal data.</p>
      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell personal data.</li>
        <li>We do not custody user funds.</li>
        <li>We do not verify merchant identity or KYC on Guard Links.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions about this policy: <a href="mailto:lw22336599@gmail.com">lw22336599@gmail.com</a>. Source code: <a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">GitHub</a>.</p>`,
);

export const termsHtml = legalPageHtml(
  "Terms of Service",
  "Non-custodial terms for the LedgerGuard public demo, Guard Links, and developer APIs.",
  `<h2>Service description</h2>
      <p>LedgerGuard provides pre-signing checks, Guard Link payment requests, evidence reconciliation, and developer APIs for USDC workflows on supported networks. The service is non-custodial: LedgerGuard never holds your keys and never signs transactions for you.</p>
      <h2>No financial guarantees</h2>
      <p>LedgerGuard is not a bank, broker, money transmitter, escrow agent, or investment adviser. An <strong>ALLOW</strong> result means implemented checks passed; it is not a guarantee of safety, profit, or merchant legitimacy. You remain responsible for reviewing every wallet prompt before signing.</p>
      <h2>Networks and real funds</h2>
      <ul>
        <li><strong>Arc Testnet Guard Links</strong> are the primary product path and use test assets with no financial value.</li>
        <li><strong>Base Mainnet x402 at <a href="/canary">/canary</a></strong> is live and operational (production gates passed) and can charge real USDC plus gas when you explicitly approve a wallet transaction. It is not a Guard Link.</li>
        <li>Do not treat testnet activity as revenue, escrow, or production settlement unless a separate written agreement says otherwise.</li>
      </ul>
      <h2>Self-declared identity on Guard Links</h2>
      <p>Issuer names shown on Guard Links are self-declared context only. LedgerGuard does not independently verify companies, domains, or individuals behind a link.</p>
      <h2>Acceptable use</h2>
      <p>You agree not to use the service for fraud, phishing, malware distribution, or attempts to bypass wallet security. Abuse may result in rate limits or blocking without notice.</p>
      <h2>Availability</h2>
      <p>The public demo is provided as-is without a commercial SLA unless separately agreed in writing. Features, networks, and limits may change as the project evolves.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href="mailto:lw22336599@gmail.com">lw22336599@gmail.com</a>.</p>`,
);

export const aboutHtml = legalPageHtml(
  "About",
  "Non-custodial stablecoin payment intent safety on Arc Testnet.",
  `<h2>What we build</h2>
      <p>LedgerGuard is a non-custodial <strong>payment intent safety</strong> service for USDC. Merchants create a <strong>Guard Link</strong>; payers review amount, recipient, and purpose before their wallet asks them to sign. After settlement, evidence can be reconciled against the declared intent.</p>
      <p>Developers use <code>@ledgerguard1/sdk</code> and our HTTP API. We map to the draft <a href="https://github.com/x402-foundation/x402/pull/2792" rel="noreferrer">x402 Payment Preflight Record</a> as a compatible oracle — see <a href="${specDocsBase}/PREFLIGHT_RECORD_MAPPING.md" rel="noreferrer">specifications on GitHub</a>.</p>
      <h2>Arc-first product path</h2>
      <p>Our primary battlefield is <strong>Arc Testnet</strong> today. Guard Link creation, sharing, wallet review, and onchain verification all run on Arc. We align with Circle&apos;s Arc and USDC ecosystem rather than spreading effort across every chain at once.</p>
      <h2>Where Base fits</h2>
      <p><strong>Base Mainnet</strong> x402 USDC is <strong>live and operational</strong> at <a href="/canary">/canary</a> (production gates passed, real USDC settlement). That path is an x402 capability demo, <em>not</em> a Base Guard Link product. We are not building Base Mainnet Guard Links until Arc has real usage and a credible mainnet path.</p>
      <h2>Who we are</h2>
      <p>LedgerGuard is an independent developer project, not a registered company. There is no token, no platform fee on Guard Link transfers, and no claim of paying customers until external evidence exists. Source code is public on <a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">GitHub</a>.</p>
      <h2>Contact</h2>
      <ul>
        <li>Email: <a href="mailto:lw22336599@gmail.com">lw22336599@gmail.com</a></li>
        <li>X: <a href="https://x.com/HuiLibaa" rel="me noreferrer">@HuiLibaa</a></li>
        <li>Demo: <a href="/guard/create">Create a Guard Link</a></li>
      </ul>
      <p>See also <a href="/privacy">Privacy</a> and <a href="/terms">Terms</a>.</p>`,
);

const siteBaseCss = `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;color:var(--text);font:16px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}main{margin:auto}nav{display:flex;align-items:center;justify-content:space-between}.subhero{padding:64px 0 38px;max-width:900px}h1{margin:20px 0 26px;letter-spacing:-.065em}h1.compact{font-size:clamp(44px,6vw,70px)}h2{font-size:28px;letter-spacing:-.03em;margin:8px 0}h3{margin:14px 0 4px}.muted,article p{color:var(--muted)}form{display:grid;gap:14px}label{display:grid;gap:6px;font-size:13px;color:var(--muted)}input{width:100%;padding:13px;font:inherit;color:var(--text)}button{cursor:pointer;font-weight:800;padding:14px;border:0}button:disabled{opacity:.6}.developer-panel{margin-bottom:28px}.panel{display:grid;grid-template-columns:1fr 1fr;gap:34px;padding:32px}.result{grid-column:1/-1;border-left:4px solid var(--success);border-radius:8px;padding:18px;min-height:96px}.result p{color:var(--muted);margin:6px 0}.result ul{margin:10px 0;padding-left:22px}.result details{margin-top:12px}.result pre,.code-card pre{white-space:pre-wrap;word-break:break-word;overflow:auto;padding:16px;color:#334155}.grid,.docs-grid{display:grid;grid-template-columns:repeat(3,1fr);padding:32px 0 64px}.grid article{border-top:1px solid var(--line);padding:22px 4px}.grid span,.doc-card span{font-size:12px;font-weight:800}.grid h3{margin:14px 0 4px}.doc-card h2{font-size:20px;overflow-wrap:anywhere}.code-card{margin-bottom:28px}.status-list{display:grid;gap:14px;margin:10px 0 30px}.status-list article{display:flex;gap:16px;align-items:flex-start;border-radius:14px;padding:20px}.status-list p{margin:4px 0 0}.status-dot{width:12px;height:12px;border-radius:99px;margin-top:6px;background:var(--orange);flex:none}.links{display:flex;gap:22px;flex-wrap:wrap;margin-top:30px}.bottom-links{margin:30px 0 54px}a{text-underline-offset:5px}footer{padding:26px 0 42px;color:var(--muted);font-size:13px}.badge.danger{color:var(--red);border-color:#fecaca;background:#fef2f2}.legal-hero{max-width:900px;padding-bottom:28px}.legal-prose{display:block;padding:28px 32px 36px;margin-bottom:64px;line-height:1.7}.legal-prose h2{font-size:20px;margin:26px 0 8px;color:var(--text)}.legal-prose h2:first-child{margin-top:0}.legal-prose p,.legal-prose li{color:var(--muted);margin:8px 0}.legal-prose ul{padding-left:22px}.legal-prose a{color:var(--link)}`;

export const unifiedBrandCss = `
:root{
  --bg:#f8fafc;
  --panel:#ffffff;
  --surface:#ffffff;
  --surface-muted:#f1f5f9;
  --line:#e2e8f0;
  --text:#0f172a;
  --muted:#64748b;
  --link:#2563eb;
  --mint:#3b82f6;
  --orange:#7c3aed;
  --red:#dc2626;
  --brand:#2563eb;
  --brand-2:#1d4ed8;
  --accent:#7c3aed;
  --success:#059669;
  --shadow:0 18px 50px #0f172a0f;
  --shadow-lg:0 24px 60px #0f172a12;
}
html{scroll-behavior:smooth}
body{
  min-height:100vh;
  background:
    radial-gradient(circle at 85% 0%,#dbeafe 0,transparent 28rem),
    radial-gradient(circle at 10% 18%,#ede9fe 0,transparent 32rem),
    var(--bg);
}
main{width:min(1180px,calc(100% - 48px))}
nav{min-height:80px;gap:24px;border-color:var(--line)}
.brand{display:inline-flex;align-items:center;gap:12px;font-size:22px;color:var(--text);text-decoration:none;font-weight:800}
.brand-mark{width:32px;height:32px;border-radius:9px;flex:none}
.brand small{color:var(--accent);font:800 11px/1 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}
.portal-nav-links,.nav-actions{display:flex;align-items:center;gap:24px}
.portal-nav-links a,.nav-actions a{color:var(--muted);font-size:14px;text-decoration:none}
.portal-nav-links a:hover,.nav-actions a:hover{color:var(--text)}
.badge{color:#1d4ed8;border:1px solid #bfdbfe;background:#eff6ff;box-shadow:none;user-select:none;pointer-events:none;flex-shrink:0;white-space:nowrap;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:800}
.eyebrow,.step{color:#2563eb;font-family:ui-monospace,Consolas,monospace;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.hero{padding:92px 0 58px}
.portal-hero{max-width:1180px;padding-bottom:64px}
.portal-hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:40px;align-items:center}
.portal-hero-copy .lead{max-width:640px;margin-bottom:18px}
.portal-hero-visual{margin:0}
.portal-hero-visual img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-lg)}
.portal-network-note{max-width:640px;margin:0 0 22px;color:var(--muted);line-height:1.65;font-size:15px}
.portal-network-note a{color:var(--link)}
.portal-trust-list{margin:16px 0 0;color:var(--muted);font-size:14px;line-height:1.6}
.portal-primary-cta{display:inline-flex;align-items:center;justify-content:center;min-width:240px;padding:16px 24px;font-size:17px;font-weight:800;text-decoration:none;background:var(--brand);color:#fff;box-shadow:0 12px 32px #2563eb33;border-radius:10px}
.portal-primary-cta:hover{filter:brightness(1.05)}
.portal-dual-cta{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.portal-secondary-cta{display:inline-flex;align-items:center;justify-content:center;min-width:200px;padding:16px 24px;font-size:17px;font-weight:800;text-decoration:none;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:10px;box-shadow:var(--shadow)}
.pay-recent-wrap{margin-top:14px}
.pay-recent-wrap button.secondary{width:100%;max-width:420px}
.payment-complete{padding:32px;border:1px solid #86efac;background:#f0fdf4;border-radius:16px;margin-bottom:24px}
.payment-complete[hidden]{display:none!important}
.payment-complete-title{margin:8px 0 16px;font-size:28px}
.payment-complete-line{margin:6px 0;color:var(--muted)}
.template-chips{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 20px}
.template-chip{padding:10px 16px;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--text);font-weight:600;font-size:14px;cursor:pointer}
.template-chip.active{border-color:var(--brand);background:#eff6ff;color:var(--brand)}
.faq-panel{margin-top:36px;padding:24px;border:1px solid var(--line);border-radius:16px;background:var(--panel)}
.faq-list{margin:0}
.faq-list dt{font-weight:700;margin-top:16px}
.faq-list dd{margin:6px 0 0;color:var(--muted)}
.how-it-works{padding:20px 0 72px;border-top:1px solid var(--line)}
.how-it-works h2.compact{font-size:clamp(34px,5vw,56px);margin:12px 0 28px;color:var(--text)}
.how-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.how-step-card{padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--panel);box-shadow:var(--shadow)}
.how-step-card img{display:block;width:100%;height:auto;margin-bottom:14px;border:1px solid var(--line);border-radius:12px}
.how-step-card h3{margin:8px 0;font-size:22px}
.how-step-card .muted{margin:0;font-size:14px;line-height:1.55}
.how-cta{margin-top:28px}
.portal-developers{padding:56px 0 72px;border-top:1px solid var(--line)}
.portal-developers h2.compact{font-size:clamp(30px,4vw,48px);margin:12px 0 14px}
.portal-developers .lead{max-width:720px;margin-bottom:18px}
.portal-developers .links{display:flex;flex-wrap:wrap;gap:18px}
.portal-developers .links a{color:var(--link);font-weight:700;text-decoration:none}
h1{font-size:clamp(54px,8vw,98px);line-height:.94;color:var(--text)}
h1 span{background:linear-gradient(90deg,#2563eb,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{max-width:850px;color:var(--muted);line-height:1.65}
.portal-actions a{padding:14px 20px;border-radius:10px;box-shadow:var(--shadow);text-decoration:none}
.primary-action,button{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff}
.secondary-action,.secondary-action.button-link{border:1px solid var(--line);color:var(--text);background:var(--panel)}
.portal-truth{padding-left:14px;border-left:2px solid #93c5fd;color:var(--muted)}
.route-hero{max-width:900px}.route-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.route-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:28px;box-shadow:var(--shadow)}.route-evidence{grid-column:1/-1}.stage-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.stage-row span{padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface-muted);color:var(--text);text-align:center}.route-card dl{grid-template-columns:minmax(120px,.7fr) 1fr}.route-card input{width:100%;box-sizing:border-box}
.product-map{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:90px}
.product-module,.doc-card,.code-card,.panel,.status-list article{
  background:var(--panel);
  border:1px solid var(--line);
  box-shadow:var(--shadow);
}
.product-module{position:relative;overflow:hidden;min-height:420px;padding:36px;border-radius:18px;display:flex;flex-direction:column}
.product-module::after{content:"";position:absolute;right:-100px;bottom:-130px;width:270px;height:270px;border-radius:50%;background:#dbeafe;filter:blur(2px);opacity:.7}
.meter-module{border-color:#ddd6fe;background:linear-gradient(145deg,#ffffff,#faf5ff)}
.meter-module::after{background:#ede9fe}
.module-number{color:#2563eb;font:800 12px/1 ui-monospace,monospace;letter-spacing:.16em}
.product-module h2{font-size:clamp(32px,4vw,50px);line-height:1;max-width:480px;margin:42px 0 18px;color:var(--text)}
.product-module p,.product-module ul{position:relative;z-index:1;color:var(--muted)}
.product-module ul{padding-left:20px;line-height:1.9}
.product-module>a{position:relative;z-index:1;margin-top:auto;color:var(--link);font-weight:800}
.platform-flow{padding:78px 0;border-top:1px solid var(--line)}
.platform-flow h2{font-size:clamp(38px,6vw,68px)}
.flow-row{display:grid;grid-template-columns:repeat(5,1fr);margin-top:34px;border:1px solid var(--line);background:var(--surface-muted);border-radius:12px;overflow:hidden}
.flow-row span{min-height:92px;padding:18px;display:flex;align-items:center;border-right:1px solid var(--line);color:var(--muted);font-size:13px}
.flow-row span:last-child{border-right:0;color:var(--text);background:#eff6ff}
.notice{border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;box-shadow:inset 3px 0 #2563eb;border-radius:12px;padding:16px 18px}
.panel{border-radius:18px}
input{background:var(--panel);border:1px solid #cbd5e1;border-radius:8px}
input:focus{outline-color:#2563eb;box-shadow:0 0 0 4px #2563eb20}
button{border-radius:10px}
button.secondary{background:var(--panel);border:1px solid var(--line);color:var(--text)}
.result,.result pre,.code-card pre{background:var(--surface-muted);border:1px solid var(--line)}
.result.allow{border-color:var(--success);background:#ecfdf5}
.result.review{border-color:#a78bfa;background:#faf5ff}
.result.block,.result.error{border-color:var(--red);background:#fef2f2}
.result.neutral{border-color:#93c5fd;background:#eff6ff}
.grid,.docs-grid{gap:20px}
.doc-card,.code-card{border-radius:14px;padding:20px}
.grid span,.doc-card span{color:var(--accent)}
.status-dot.ok{background:var(--success);box-shadow:0 0 10px #05966944}
.status-dot.bad{background:var(--red)}
.decision-code{display:block;margin-bottom:6px;color:#2563eb;font:800 11px/1 ui-monospace,Consolas,monospace;letter-spacing:.14em}
.wallet-panel{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:28px 0;padding:28px;border:1px solid var(--line);border-radius:16px;background:var(--panel);box-shadow:var(--shadow)}
.wallet-buttons{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.wallet-buttons button{flex:1;min-width:170px}
.wallet-panel>.result{grid-column:1/-1}
.button-link{display:inline-flex;align-items:center;justify-content:center;padding:13px 16px;border-radius:8px;background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;text-decoration:none;font-weight:800}
.builder-panel{align-items:start}
.chain-selector-row{display:grid;gap:8px;margin-bottom:18px;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--surface-muted)}
.chain-network-active{display:grid;gap:6px}
.chain-network-label{font-size:13px;font-weight:700;color:var(--link)}
.chain-network-active strong{font-size:18px;color:var(--text)}
.chain-selector-notice{margin:0;font-size:13px;line-height:1.55;color:var(--muted)}
.chain-selector-notice a{color:var(--link)}
.site-footer{display:grid;gap:10px;padding:28px 0 36px;border-top:1px solid var(--line);line-height:1.7}
.footer-primary,.footer-links,.footer-partners{color:var(--muted);font-size:14px}
.footer-partners a{color:var(--link);text-decoration:none}
.footer-links a,.footer-primary a{color:var(--link);text-decoration:none}
.footer-social{padding-top:6px;border-top:1px solid var(--line)}
.footer-social a{color:var(--text);font-weight:700;text-decoration:none}
.footer-social a:hover{color:var(--brand)}
.builder-panel .result input{margin:14px 0}
.builder-panel form{grid-template-columns:1fr 1fr}
.builder-panel form label:nth-of-type(1),.builder-panel form label:nth-of-type(2),.builder-panel form details,.builder-panel form button{grid-column:1/-1}
.field-help{display:block;margin-top:4px;font-size:12px;color:var(--muted)}
.builder-advanced{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--surface-muted)}
.builder-advanced summary{cursor:pointer;color:var(--link);font-weight:700}
.builder-advanced-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.guard-qr-wrap{display:grid;justify-items:start;gap:10px;margin:16px 0 4px}
.guard-qr-wrap canvas{border:1px solid var(--line);border-radius:12px;background:#fff;padding:8px}
.guard-cta{margin:28px 0;padding:28px;border:1px solid var(--line);border-radius:16px;background:var(--panel);box-shadow:var(--shadow);text-align:center}
.guard-cta h2{margin:10px 0 8px;font-size:clamp(28px,4vw,40px);color:var(--text)}
.guard-cta .button-link{margin-top:12px}
.guard-cta-highlight{border-color:#93c5fd;box-shadow:0 0 0 1px #93c5fd,var(--shadow)}
.guard-cta-verified{border-color:var(--success);box-shadow:0 0 0 1px #34d399,var(--shadow);background:linear-gradient(145deg,#ecfdf5,#ffffff)}
.guard-cta-verified .step{color:#047857}
.guard-cta-verified h2{color:#065f46}
.preflight-status-bar{margin:0 0 1.25rem;padding:1rem 1.1rem;border-radius:14px;border:1px solid var(--line)}
.preflight-status-bar .step{margin-bottom:.35rem}
.preflight-status-bar.allow{border-color:#34d399;background:linear-gradient(145deg,#ecfdf5,#ffffff)}
.preflight-status-bar.review{border-color:#fbbf24;background:linear-gradient(145deg,#fffbeb,#ffffff)}
.preflight-status-bar.block{border-color:#f87171;background:linear-gradient(145deg,#fef2f2,#ffffff)}
.wallet-picker-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:#0f172a66;backdrop-filter:blur(4px)}
.wallet-picker-dialog{width:min(420px,calc(100vw - 32px));padding:24px;border:1px solid var(--line);border-radius:18px;background:var(--panel);box-shadow:var(--shadow-lg)}
.wallet-picker-dialog h2{margin:0 0 8px;font-size:24px;color:var(--text)}
.wallet-picker-lead{margin:0 0 18px;color:var(--muted);font-size:14px;line-height:1.55}
.wallet-help-steps{margin:0 0 20px;padding-left:20px;color:var(--muted);line-height:1.7}
.wallet-help-steps a{color:var(--link)}
.guide-track{display:grid;gap:18px;padding-top:28px;margin-top:28px;border-top:1px solid var(--line)}
.field-help{margin:8px 0 0;color:var(--muted);font-size:13px;line-height:1.6}
.field-help a{color:var(--link);text-decoration:none}
.wallet-picker-list{display:grid;gap:10px;margin-bottom:16px}
.wallet-picker-option{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface-muted);color:var(--text);cursor:pointer;text-align:left}
.wallet-picker-option:hover{border-color:#93c5fd;box-shadow:0 0 0 1px #93c5fd44}
.wallet-picker-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-weight:800;overflow:hidden;flex:none}
.wallet-picker-icon img{width:28px;height:28px;border-radius:8px}
.wallet-picker-name{font-weight:700}
.wallet-picker-cancel{width:100%}
.links a{color:var(--link)}
.nav-wallet-btn,#nav-connect,#w-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;background:linear-gradient(135deg,var(--brand),var(--brand-2));border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
.nav-wallet-btn:hover,#nav-connect:hover,#w-btn:hover{box-shadow:0 4px 15px #2563eb44}
.nav-wallet-btn.connected,#nav-connect.connected,#w-btn.w-connected{background:transparent;border:1px solid var(--success);color:var(--success)}
.nav-wallet-display{display:none;font-size:12px;color:var(--link);font-family:ui-monospace,monospace;white-space:nowrap}
.portal-nav{display:flex;align-items:center;flex-wrap:wrap;gap:12px 18px;border-bottom:1px solid var(--line);padding:18px 0;margin-bottom:12px}
.portal-nav-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-left:auto;min-width:0}
.notice,.doc-card p,code{overflow-wrap:anywhere;word-break:break-word}
.nav-menu-toggle{display:none;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}
.nav-mobile-panel{display:none;flex-direction:column;gap:12px;width:100%;padding:14px 0 4px}
.nav-mobile-panel a{color:var(--muted);text-decoration:none;font-size:15px}
.nav-mobile-panel.open{display:flex}
.wallet-status-card{border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:20px;background:var(--surface-muted)}
.wallet-status-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.wallet-status-dot{width:10px;height:10px;border-radius:50%;background:#94a3b8;flex:none}
.wallet-status-label{flex:1;color:var(--muted);min-width:160px}
.wallet-status-detail{margin-top:10px;font-family:ui-monospace,monospace;font-size:13px;color:var(--muted);word-break:break-all}
.wallet-connected{border-color:var(--success)}
.route-readiness{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:16px 0;background:var(--surface-muted)}
.route-readiness p{margin:8px 0 0;color:var(--muted);line-height:1.55}
.route-readiness a{color:var(--link)}
.route-help{font-size:14px}
.route-action-btn,.route-action-link{display:inline-flex;align-items:center;justify-content:center;margin-top:10px;padding:12px 18px;border-radius:10px;background:linear-gradient(135deg,var(--brand),var(--brand-2));border:none;color:#fff;font-weight:800;cursor:pointer;text-decoration:none}
.route-action-link{box-shadow:var(--shadow)}
.route-readiness.neutral{border-color:#cbd5e1}
.route-readiness.allow{border-color:var(--success);background:#ecfdf5}
.route-readiness.review{border-color:#c4b5fd;background:#faf5ff}
footer{border-color:var(--line);line-height:1.9}
@media(max-width:900px){
  .portal-nav{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"brand menu" "panel panel" "actions actions";align-items:center;gap:10px 12px}
  .portal-nav .brand{grid-area:brand;min-width:0}
  .portal-nav .nav-menu-toggle{grid-area:menu;justify-self:end;display:inline-flex}
  .portal-nav-links{display:none}
  .portal-nav .nav-mobile-panel{grid-area:panel;width:100%;padding:8px 0 2px;margin:0}
  .portal-nav .nav-mobile-panel:not(.open){display:none}
  .portal-nav .nav-mobile-panel.open{display:flex}
  .portal-nav-actions{grid-area:actions;width:100%;margin-left:0;justify-content:space-between;gap:10px}
  .portal-nav-actions .badge{flex:0 1 auto;min-width:0;max-width:55%;white-space:normal;text-align:center;line-height:1.25}
  .portal-nav-actions .nav-wallet-btn{flex:0 1 auto;min-width:0;max-width:100%}
  .portal-hero-grid{grid-template-columns:1fr;gap:28px}
  .portal-hero-visual{order:-1}
  .portal-dual-cta a{width:100%;max-width:100%;min-width:0;box-sizing:border-box}
  .how-steps{grid-template-columns:1fr}
  .route-grid{grid-template-columns:1fr}.route-evidence{grid-column:auto}.stage-row{grid-template-columns:1fr 1fr}
  .flow-row{grid-template-columns:1fr}
  .flow-row span{min-height:60px;border-right:0;border-bottom:1px solid var(--line)}
  .flow-row span:last-child{border-bottom:0}
}
@media(max-width:760px){
  html{overflow-x:clip}
  main{width:min(100% - 28px,1180px);max-width:100%}
  nav{min-height:72px}
  .hero,.subhero{padding:54px 0 36px}
  .product-map,.panel,.grid,.docs-grid{grid-template-columns:1fr}
  .wallet-panel,.builder-panel form{grid-template-columns:1fr}
  .builder-panel form label{grid-column:1/-1}
  .builder-advanced-grid{grid-template-columns:1fr}
  .product-map{padding-bottom:0}
  .product-module{min-height:360px}
  h1,h1.compact{font-size:clamp(43px,13vw,58px)}
  .lead{font-size:17px}
  .badge{font-size:9px}
  .portal-primary-cta{width:100%;min-width:0}
}
@media(max-width:480px){
  main{width:min(100% - 20px,1180px)}
  .portal-actions a{width:100%;text-align:center;box-sizing:border-box}
  .how-step-card{padding:14px}
}
`;

export const siteCss = `${siteBaseCss}${unifiedBrandCss}`;

export const demoJs = `const form=document.querySelector("#preflight");const result=document.querySelector("#result");const title=document.querySelector("#result-title");const summary=document.querySelector("#result-summary");const findings=document.querySelector("#result-findings");const details=document.querySelector("#result-details");const json=document.querySelector("#result-json");const usdc="0x3600000000000000000000000000000000000000";const messages={ALLOW:"The implemented checks passed. Continue only after reviewing the transaction in your wallet.",REVIEW:"Information is incomplete or an unknown condition remains. Review before proceeding.",BLOCK:"A defined risk was detected. Do not sign or send this transaction."};const clear=()=>{findings.replaceChildren();details.hidden=true;json.textContent=""};const show=(kind,heading,message)=>{result.className="result "+kind;title.textContent=heading;summary.textContent=message};const stale=(message)=>{clear();show("review","Result expired",message)};form.addEventListener("input",()=>stale("The input changed. Run the check again."));form.addEventListener("invalid",()=>stale("Correct the invalid input before running the check."),true);const units=(v)=>{if(!/^\\d+(\\.\\d{0,6})?$/.test(v))throw new Error("The amount must be a positive number with no more than 6 decimal places.");const [w,f=""]=v.split(".");const value=BigInt(w)*1000000n+BigInt((f+"000000").slice(0,6));if(value<=0n)throw new Error("The amount must be greater than zero.");return value.toString()};const address=(v,label)=>{if(!/^0x[0-9a-fA-F]{40}$/.test(v))throw new Error(label+" is not a valid EVM address.");return v};const pad=(v)=>v.slice(2).toLowerCase().padStart(64,"0");form.addEventListener("submit",async(e)=>{e.preventDefault();const button=form.querySelector("button");button.disabled=true;clear();show("neutral","Checking","Parsing the transaction and evaluating Arc Testnet policy…");try{const recipient=address(document.querySelector("#recipient").value.trim(),"Recipient address");const payerValue=document.querySelector("#payer").value.trim();const payer=payerValue?address(payerValue,"Payer public address"):"";const amount=units(document.querySelector("#amount").value.trim());const limit=units(document.querySelector("#limit").value.trim());const data="0xa9059cbb"+pad(recipient)+BigInt(amount).toString(16).padStart(64,"0");const intent={action:"transfer",expectedRecipient:recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:amount,purpose:"LedgerGuard browser demo"};if(payer)intent.expectedDebitAddress=payer;const payload={network:"arcTestnet",to:usdc,data,valueWei:"0",intent,policy:{requireSimulation:Boolean(payer),maxAmountMicroUsdc:limit}};if(payer)payload.from=payer;const response=await fetch("/v1/preflight",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const body=await response.json();if(!response.ok)throw new Error(body.message||body.error||"Request failed");show(body.decision.toLowerCase(),body.decision,messages[body.decision]||"Check completed.");for(const item of body.findings||[]){const li=document.createElement("li");li.textContent=item.code+": "+item.message;findings.append(li)}if(!body.findings?.length){const li=document.createElement("li");li.textContent="No known issue was found in the recipient, asset, amount, payer, or simulation.";findings.append(li)}json.textContent=JSON.stringify(body,null,2);details.hidden=false}catch(error){show("error","Check failed",error instanceof Error?error.message:"Unknown error");}finally{button.disabled=false}});`;

export const developerConsoleJs = `const registerForm=document.querySelector("#developer-register");const loginForm=document.querySelector("#developer-login");const keyInput=document.querySelector("#developer-key");const result=document.querySelector("#developer-result");const title=document.querySelector("#developer-title");const summary=document.querySelector("#developer-summary");const actions=document.querySelector("#developer-actions");const details=document.querySelector("#developer-details");const output=document.querySelector("#developer-json");const runButton=document.querySelector("#developer-run");const rotateButton=document.querySelector("#developer-rotate");const copyButton=document.querySelector("#developer-copy");let apiKey=sessionStorage.getItem("ledgerguard.test.apiKey")||"";if(apiKey)keyInput.value=apiKey;const show=(kind,heading,message,data)=>{result.className="result "+kind;title.textContent=heading;summary.textContent=message;if(data){output.textContent=JSON.stringify(data,null,2);details.hidden=false}else{output.textContent="";details.hidden=true}};const remember=(value)=>{apiKey=value;keyInput.value=value;sessionStorage.setItem("ledgerguard.test.apiKey",value);actions.hidden=false};const request=async(path,options={})=>{const headers={...(options.headers||{})};if(apiKey)headers.authorization="Bearer "+apiKey;const response=await fetch(path,{...options,headers});const body=await response.json().catch(()=>({error:"INVALID_RESPONSE"}));if(!response.ok){const error=new Error(body.message||body.error||"Request failed");error.body=body;throw error}return body};const load=async()=>{const body=await request("/v1/developer/account");actions.hidden=false;show("allow","Account loaded",body.usage.used+" of "+body.usage.limit+" testnet units used this month.",body)};registerForm.addEventListener("submit",async(event)=>{event.preventDefault();show("neutral","Creating account","Allocating a revocable test key in the durable store…");try{const body=await request("/v1/developer/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:document.querySelector("#developer-name").value.trim()})});remember(body.apiKey);show("allow","Test API key created","Save the key now. It is displayed only once by the service.",body);actions.hidden=false}catch(error){show("error","Registration failed",error.message,error.body)}});loginForm.addEventListener("submit",async(event)=>{event.preventDefault();remember(keyInput.value.trim());try{await load()}catch(error){actions.hidden=true;show("error","Could not load account",error.message,error.body)}});runButton.addEventListener("click",async()=>{show("neutral","Running metered check","Recording one unit and evaluating a deterministic Arc Testnet request…");const recipient="0x2222222222222222222222222222222222222222";const usdc="0x3600000000000000000000000000000000000000";const data="0xa9059cbb"+recipient.slice(2).padStart(64,"0")+"00000000000000000000000000000000000000000000000000000000000f4240";try{const body=await request("/v1/developer/preflight",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({network:"arcTestnet",to:usdc,data,valueWei:"0",intent:{action:"transfer",expectedRecipient:recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:"1000000",purpose:"Developer console metered test"},policy:{requireSimulation:false,maxAmountMicroUsdc:"1000000"}})});show(body.decision==="BLOCK"?"block":"review","Metered preflight: "+body.decision,"Usage was recorded in the durable ledger.",body)}catch(error){show("error","Metered request failed",error.message,error.body)}});rotateButton.addEventListener("click",async()=>{if(!confirm("Rotate this API key? The current key will stop working immediately."))return;try{const body=await request("/v1/developer/keys/rotate",{method:"POST"});remember(body.apiKey);show("allow","API key rotated","The previous key is revoked. Save the replacement now.",body)}catch(error){show("error","Key rotation failed",error.message,error.body)}});copyButton.addEventListener("click",async()=>{if(!apiKey)return;try{await navigator.clipboard.writeText(apiKey);show("allow","API key copied","The current test key was copied to the clipboard.")}catch{show("error","Copy failed","Copy the key manually from the key field.")}});`;
