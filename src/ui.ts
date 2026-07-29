export const demoHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="LedgerGuard checks Arc USDC payment intent before an AI agent signs.">
  <title>LedgerGuard | Arc payment preflight</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main>
    <nav><span class="brand">LedgerGuard</span><span class="badge">ARC TESTNET</span></nav>
    <section class="hero">
      <p class="eyebrow">NON-CUSTODIAL PAYMENT CONTROL</p>
      <h1>Let agents pay.<br><span>Keep policy in control.</span></h1>
      <p class="lead">Inspect an Arc USDC transfer before signing. LedgerGuard never asks for a seed phrase or private key.</p>
      <div class="links"><a href="/openapi.json">OpenAPI</a><a href="/.well-known/ledgerguard.json">Agent catalog</a><a href="/v1/networks">Network registry</a><a href="/ready">Live readiness</a></div>
    </section>
    <section class="panel">
      <div>
        <p class="step">LIVE DEMO</p>
        <h2>Check a USDC payment intent</h2>
        <p class="muted">This creates unsigned calldata and runs the policy decoder. No sender is supplied, so simulation is intentionally not run and the result remains REVIEW.</p>
      </div>
      <form id="preflight">
        <label>Recipient address<input id="recipient" value="0x2222222222222222222222222222222222222222" required pattern="0x[0-9a-fA-F]{40}"></label>
        <label>Amount (USDC)<input id="amount" value="1.00" required inputmode="decimal" min="0.000001" step="0.000001"></label>
        <label>Policy limit (USDC)<input id="limit" value="10.00" required inputmode="decimal" min="0.000001" step="0.000001"></label>
        <button type="submit">Run preflight</button>
      </form>
      <pre id="result" aria-live="polite">Ready. No wallet connection required.</pre>
    </section>
    <section class="grid">
      <article><span>01</span><h3>Declare intent</h3><p>State recipient, asset, amount and purpose.</p></article>
      <article><span>02</span><h3>Simulate safely</h3><p>Read-only RPC checks; no custody and no signing.</p></article>
      <article><span>03</span><h3>Keep evidence</h3><p>Reconcile a finalized transaction against its declared intent.</p></article>
    </section>
    <footer>Testnet software | Mainnet disabled pending official Arc parameters and an explicit release review. Contact: <a href="mailto:lw22336599@gmail.com">email</a> · <a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">GitHub</a>.</footer>
  </main>
  <script src="/app.js" defer></script>
</body>
</html>`;

export const demoCss = `:root{color-scheme:dark;--bg:#07100d;--panel:#101b17;--line:#263a32;--text:#effbf5;--muted:#9bb2a8;--mint:#82f4bd;--orange:#ffb86b}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 5%,#17382b 0,transparent 34%),var(--bg);color:var(--text);font:16px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}main{width:min(1120px,calc(100% - 40px));margin:auto}nav{height:86px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{font-weight:800;font-size:20px;letter-spacing:-.03em}.badge,.step,.eyebrow{font-size:12px;letter-spacing:.14em;font-weight:800}.badge{color:var(--mint);border:1px solid #4d896d;padding:7px 10px;border-radius:99px}.hero{padding:84px 0 56px;max-width:850px}.eyebrow,.step{color:var(--mint)}h1{font-size:clamp(48px,8vw,92px);line-height:.95;letter-spacing:-.065em;margin:20px 0 26px}h1 span{color:var(--mint)}.lead{font-size:20px;color:var(--muted);max-width:680px}.links{display:flex;gap:22px;flex-wrap:wrap;margin-top:30px}a{color:var(--text);text-underline-offset:5px}.panel{background:linear-gradient(145deg,#13241d,#0d1713);border:1px solid var(--line);border-radius:22px;padding:32px;display:grid;grid-template-columns:1fr 1fr;gap:44px;box-shadow:0 25px 80px #0005}h2{font-size:30px;letter-spacing:-.03em;margin:8px 0}.muted,article p{color:var(--muted)}form{display:grid;gap:14px}label{display:grid;gap:6px;font-size:13px;color:var(--muted)}input{width:100%;background:#07100d;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:13px;font:inherit}input:focus{outline:2px solid var(--mint);outline-offset:1px}button{border:0;border-radius:10px;background:var(--mint);color:#07100d;font-weight:800;padding:14px;cursor:pointer}button:disabled{opacity:.6}pre{grid-column:1/-1;white-space:pre-wrap;word-break:break-word;background:#07100d;border-left:3px solid var(--mint);border-radius:8px;padding:18px;color:#c8e8d9;min-height:76px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:32px 0 64px}.grid article{border-top:1px solid var(--line);padding:22px 4px}.grid span{color:var(--orange);font-size:12px;font-weight:800}.grid h3{margin:14px 0 4px}footer{border-top:1px solid var(--line);padding:26px 0 42px;color:var(--muted);font-size:13px}@media(max-width:720px){main{width:min(100% - 24px,1120px)}.hero{padding:54px 0 38px}.panel{grid-template-columns:1fr;padding:22px;gap:24px}.grid{grid-template-columns:1fr}h1{font-size:52px}}`;

export const demoJs = `const form=document.querySelector("#preflight");const result=document.querySelector("#result");const usdc="0x3600000000000000000000000000000000000000";const units=(v)=>{if(!/^\\d+(\\.\\d{0,6})?$/.test(v))throw new Error("Use a positive number with up to 6 decimals.");const [w,f=""]=v.split(".");const value=BigInt(w)*1000000n+BigInt((f+"000000").slice(0,6));if(value<=0n)throw new Error("Amount must be greater than zero.");return value.toString()};const pad=(v)=>{if(!/^0x[0-9a-fA-F]{40}$/.test(v))throw new Error("Enter a valid EVM recipient address.");return v.slice(2).toLowerCase().padStart(64,"0")};form.addEventListener("submit",async(e)=>{e.preventDefault();const button=form.querySelector("button");button.disabled=true;result.textContent="Checking Arc Testnet policy...";try{const recipient=document.querySelector("#recipient").value.trim();const amount=units(document.querySelector("#amount").value.trim());const limit=units(document.querySelector("#limit").value.trim());const data="0xa9059cbb"+pad(recipient)+BigInt(amount).toString(16).padStart(64,"0");const response=await fetch("/v1/preflight",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({network:"arcTestnet",to:usdc,data,valueWei:"0",intent:{action:"transfer",expectedRecipient:recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:amount,purpose:"LedgerGuard browser demo"},policy:{requireSimulation:false,maxAmountMicroUsdc:limit}})});const body=await response.json();if(!response.ok)throw new Error(body.error||"Request failed");result.textContent=JSON.stringify(body,null,2);result.style.borderColor=body.decision==="ALLOW"?"#82f4bd":body.decision==="BLOCK"?"#ff6b6b":"#ffb86b"}catch(error){result.textContent="Error: "+error.message;result.style.borderColor="#ff6b6b"}finally{button.disabled=false}});`;
