const pageHead = (title: string, description: string) => `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
  <script defer src="/_vercel/insights/script.js"></script>
</head>`;

const footer = `<footer>Arc 测试网软件 · 主网保持关闭，直至官方参数核验和人工发布审批完成。联系：<a href="mailto:lw22336599@gmail.com">邮箱</a> · <a href="/test">参与测试</a> · <a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">GitHub</a></footer>`;

export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="LedgerGuard">
  <rect width="64" height="64" rx="16" fill="#06140f"/>
  <path d="M32 10 51 18v13c0 12-7.5 20.5-19 24-11.5-3.5-19-12-19-24V18l19-8Z" fill="#7df2bd"/>
  <path d="M32 18v28c7.2-3 11-8.2 11-15.5v-7L32 18Z" fill="#06140f"/>
</svg>`;

export const demoHtml = `${pageHead(
  "LedgerGuard | Arc 支付安全检查",
  "LedgerGuard 在签名前检查 Arc USDC 支付意图，不接触私钥，不替用户签名。",
)}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">ARC TESTNET</span></nav>
    <section class="hero">
      <p class="eyebrow">非托管支付防火墙 · NON-CUSTODIAL</p>
      <h1>让代理付款。<br><span>让规则守住资金。</span></h1>
      <p class="lead">在钱包签名前检查 Arc USDC 收款人、金额、资产与策略。只填写公开地址，永远不要输入私钥或助记词。</p>
      <div class="links"><a href="/test">参与测试</a><a href="/docs">开发者文档</a><a href="/catalog">服务目录</a><a href="/status">运行状态</a><a href="https://github.com/lw22336599-rgb/ledgerguard" rel="noreferrer">源代码</a></div>
    </section>
    <section class="notice" role="note"><strong>测试网提示：</strong>当前页面只使用无金融价值的 Arc 测试资产。LedgerGuard 不连接钱包、不发起交易，也不会要求签名。</section>
    <section class="panel">
      <div>
        <p class="step">公开演示 · LIVE DEMO</p>
        <h2>检查一笔 USDC 支付意图</h2>
        <p class="muted">不填付款人时只做规则检查，结果为 REVIEW；填写公开付款地址后会增加只读模拟，才可能得到 ALLOW。ALLOW 只代表当前已实现检查通过，不是收益或绝对安全保证。</p>
      </div>
      <form id="preflight">
        <label>收款地址 · Recipient<input id="recipient" value="0x2222222222222222222222222222222222222222" required pattern="0x[0-9a-fA-F]{40}" autocomplete="off"></label>
        <label>金额（USDC）· Amount<input id="amount" value="1.00" required inputmode="decimal" pattern="\\d+(\\.\\d{1,6})?" autocomplete="off"></label>
        <label>单笔上限（USDC）· Policy limit<input id="limit" value="10.00" required inputmode="decimal" pattern="\\d+(\\.\\d{1,6})?" autocomplete="off"></label>
        <label>付款人公开地址（可选）· Public payer<input id="payer" placeholder="0x…（不要填写私钥）" pattern="0x[0-9a-fA-F]{40}" autocomplete="off"></label>
        <button type="submit">开始安全检查 · Run preflight</button>
      </form>
      <section id="result" class="result neutral" aria-live="polite" aria-atomic="true">
        <strong id="result-title">等待检查</strong>
        <p id="result-summary">无需连接钱包，不会发送交易。</p>
        <ul id="result-findings"></ul>
        <details id="result-details" hidden><summary>查看技术详情 · Technical details</summary><pre id="result-json"></pre></details>
      </section>
    </section>
    <section class="grid">
      <article><span>01</span><h3>声明真实意图</h3><p>明确付款人、收款人、资产、金额和上限。</p></article>
      <article><span>02</span><h3>只读模拟</h3><p>通过 Arc RPC 模拟，不保管密钥，不签名。</p></article>
      <article><span>03</span><h3>链上核对</h3><p>交易完成后，把真实资金流与原始意图逐项匹配。</p></article>
    </section>
    ${footer}
  </main>
  <script src="/app.js" defer></script>
</body>
</html>`;

export const developerDocsHtml = `${pageHead(
  "LedgerGuard | 开发者文档",
  "LedgerGuard API 的人类可读使用说明。",
)}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">DEVELOPER DOCS</span></nav>
    <section class="subhero">
      <p class="eyebrow">开发者入口 · HUMAN-READABLE</p>
      <h1 class="compact">API 文档</h1>
      <p class="lead">这里是给人阅读的说明。<a href="/openapi.json">原始 OpenAPI JSON</a> 是供程序、SDK 和 AI Agent 自动读取的机器文件，直接打开显示一行代码是正常现象。</p>
    </section>
    <section class="docs-grid">
      <article class="doc-card"><span>POST</span><h2>/v1/preflight</h2><p>在签名前解析、比对并模拟未签名交易。返回 ALLOW、REVIEW 或 BLOCK。</p></article>
      <article class="doc-card"><span>POST</span><h2>/v1/evidence</h2><p>交易确认后，核对付款人、收款人、资产、金额和额外副作用。</p></article>
      <article class="doc-card"><span>GET + x402</span><h2>/v1/paid/network-risk</h2><p>Arc 测试网付费资源。未支付时返回标准 HTTP 402 挑战。</p></article>
    </section>
    <section class="code-card">
      <h2>最小请求示例</h2>
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
    <section class="notice"><strong>判定边界：</strong>只有所有已实现规则通过且只读模拟成功才会返回 ALLOW。未知调用、未声明付款人或未运行模拟不会被当作可安全签名。</section>
    <div class="links bottom-links"><a href="/openapi.json">原始 OpenAPI</a><a href="/.well-known/ledgerguard.json">原始 Agent 目录</a><a href="/v1/networks">原始网络注册表</a><a href="/docs/integration">集成边界</a></div>
    ${footer}
  </main>
</body>
</html>`;

export function catalogHtml(
  priceMicroUsdc: string,
  sellerAddress?: string | null,
): string {
  return `${pageHead(
    "LedgerGuard | 服务目录",
    "LedgerGuard 面向普通用户、开发者和 AI Agent 的服务入口。",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">SERVICE CATALOG</span></nav>
    <section class="subhero">
      <p class="eyebrow">服务目录 · SERVICE CATALOG</p>
      <h1 class="compact">三个入口，一套安全核心</h1>
      <p class="lead">普通用户使用网页检查，开发者调用 API，AI Agent 读取机器目录并通过 x402 购买资源。</p>
    </section>
    <section class="docs-grid">
      <article class="doc-card"><span>FREE</span><h2>Guard Link</h2><p>无需钱包连接的支付意图检查。适合普通用户理解风险。</p><a href="/">立即检查</a></article>
      <article class="doc-card"><span>FREE API</span><h2>Preflight + Evidence</h2><p>签名前检查与交易后核对，适合钱包、代理和支付应用。</p><a href="/docs">查看文档</a></article>
      <article class="doc-card"><span>X402 TESTNET</span><h2>Network Risk</h2><p>当前价格 ${priceMicroUsdc} micro-USDC（测试资产），验证自动发现、支付和交付闭环。</p><a href="/.well-known/ledgerguard.json">机器目录</a></article>
    </section>
    <section class="notice"><strong>商业状态：</strong>测试网付费闭环已经技术验证，但测试币没有金融价值；目前不声称已有客户、经常性收入或主网 SLA。${sellerAddress ? ` 当前公开测试收款地址：<code>${sellerAddress}</code>。` : ""}</section>
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
    "LedgerGuard | Arc 测试网体验",
    "无需提供私钥，按步骤测试 LedgerGuard 的网页、API 和 x402 支付闭环。",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">PUBLIC TEST</span></nav>
    <section class="subhero">
      <p class="eyebrow">公开测试入口 · TESTNET ONLY</p>
      <h1 class="compact">一次走完测试闭环</h1>
      <p class="lead">普通用户可直接体验免费检查；开发者可复制 API 请求；持有 Arc 测试币的钱包可验证 x402 支付、结算与资源交付。全程只使用无金融价值的测试资产。</p>
    </section>
    <section class="docs-grid">
      <article class="doc-card"><span>1 · EVERYONE</span><h2>网页安全检查</h2><p>无需连接钱包。填写公开地址和金额，查看规则判断与技术详情。</p><a href="/">打开 Guard Link</a></article>
      <article class="doc-card"><span>2 · DEVELOPERS</span><h2>调用免费 API</h2><p>调用 <code>POST /v1/preflight</code>，响应头会返回可用于排查问题的公开请求编号。</p><a href="/docs">复制请求示例</a></article>
      <article class="doc-card"><span>3 · X402</span><h2>测试自动付款</h2><p>访问 <code>GET /v1/paid/network-risk</code> 会收到 ${priceMicroUsdc} micro-USDC 的标准 402 挑战；买方脚本完成签名和结算后自动获得资源与链上回执。</p><a href="https://github.com/lw22336599-rgb/ledgerguard/blob/main/docs/X402_BUYER_RUNBOOK.md" rel="noreferrer">付款测试手册</a></article>
    </section>
    <section class="notice"><strong>完成标准：</strong>记录页面结果、响应头中的 X-LedgerGuard-Request-Id，或公开的 Arc 测试网交易哈希；不要提交私钥、助记词、API Token 或个人金融信息。</section>
    ${sellerAddress ? `<section class="notice"><strong>测试网收款地址：</strong><code>${sellerAddress}</code>。它只接收 Arc 测试网 x402 结算；服务端不保存该钱包私钥。</section>` : ""}
    <div class="links bottom-links"><a href="https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose" rel="noreferrer">提交测试结果或问题</a><a href="/status">查看运行状态</a><a href="mailto:lw22336599@gmail.com">邮件联系</a></div>
    ${footer}
  </main>
</body>
</html>`;
}

export function statusHtml(input: {
  ready: boolean;
  chainId?: number;
  blockNumber?: string;
  x402: boolean;
  mainnet: boolean;
}): string {
  const rpcLabel = input.ready
    ? `正常 · Arc Testnet ${input.chainId} · Block ${input.blockNumber}`
    : "异常 · 当前 RPC 探测未通过";
  return `${pageHead(
    "LedgerGuard | 运行状态",
    "LedgerGuard Arc 测试网实时运行状态。",
  )}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge ${input.ready ? "" : "danger"}">${input.ready ? "OPERATIONAL" : "DEGRADED"}</span></nav>
    <section class="subhero">
      <p class="eyebrow">实时状态 · LIVE STATUS</p>
      <h1 class="compact">${input.ready ? "服务运行正常" : "服务部分降级"}</h1>
      <p class="lead">此页面在打开时执行一次只读 Arc Testnet RPC 检查，不连接钱包、不签名。</p>
    </section>
    <section class="status-list">
      <article><span class="status-dot ${input.ready ? "ok" : "bad"}"></span><div><strong>Arc Testnet RPC</strong><p>${rpcLabel}</p></div></article>
      <article><span class="status-dot ${input.x402 ? "ok" : "warn"}"></span><div><strong>x402 测试网端点</strong><p>${input.x402 ? "已启用" : "安全关闭"}</p></div></article>
      <article><span class="status-dot ${input.mainnet ? "bad" : "ok"}"></span><div><strong>Arc Mainnet</strong><p>${input.mainnet ? "已启用，需要立即复核" : "保持关闭（预期状态）"}</p></div></article>
    </section>
    <div class="links bottom-links"><a href="/ready">原始就绪数据</a><a href="/health">进程健康数据</a><a href="/v1/networks">网络注册表</a></div>
    ${footer}
  </main>
</body>
</html>`;
}

export const integrationBoundaryHtml = `${pageHead(
  "LedgerGuard | 集成边界",
  "LedgerGuard 的安全判定、托管和主网边界。",
)}
<body>
  <main>
    <nav><a class="brand" href="/">LedgerGuard</a><span class="badge">SAFETY BOUNDARY</span></nav>
    <section class="subhero"><p class="eyebrow">集成边界 · SAFETY</p><h1 class="compact">系统会做什么，不会做什么</h1></section>
    <section class="docs-grid">
      <article class="doc-card"><span>DOES</span><h2>检查与核对</h2><p>解析已支持调用、执行只读模拟、匹配意图、输出可复核证据摘要。</p></article>
      <article class="doc-card"><span>NEVER</span><h2>不碰密钥</h2><p>不索取私钥或助记词，不托管资产，不代替钱包签名，不自动发起真实交易。</p></article>
      <article class="doc-card"><span>FAIL CLOSED</span><h2>未知即降级</h2><p>未知调用、模拟失败、网络不一致或主网未批准时不会返回可直接签名的结论。</p></article>
    </section>
    <section class="notice"><strong>重要：</strong>LedgerGuard 是附加安全层，不替代钱包确认、合约审计、企业审批或用户最终判断。</section>
    ${footer}
  </main>
</body>
</html>`;

export const demoCss = `:root{color-scheme:dark;--bg:#07100d;--panel:#101b17;--line:#263a32;--text:#effbf5;--muted:#9bb2a8;--mint:#82f4bd;--orange:#ffb86b;--red:#ff7474}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 5%,#17382b 0,transparent 34%),var(--bg);color:var(--text);font:16px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}main{width:min(1120px,calc(100% - 40px));margin:auto}nav{height:86px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{font-weight:800;font-size:20px;letter-spacing:-.03em;text-decoration:none}.badge,.step,.eyebrow{font-size:12px;letter-spacing:.14em;font-weight:800}.badge{color:var(--mint);border:1px solid #4d896d;padding:7px 10px;border-radius:99px}.badge.danger{color:var(--red);border-color:#8b4545}.hero{padding:76px 0 48px;max-width:900px}.subhero{padding:64px 0 38px;max-width:900px}.eyebrow,.step{color:var(--mint)}h1{font-size:clamp(48px,8vw,92px);line-height:.95;letter-spacing:-.065em;margin:20px 0 26px}h1.compact{font-size:clamp(44px,6vw,70px)}h1 span{color:var(--mint)}.lead{font-size:20px;color:var(--muted);max-width:760px}.links{display:flex;gap:22px;flex-wrap:wrap;margin-top:30px}.bottom-links{margin:30px 0 54px}a{color:var(--text);text-underline-offset:5px}.notice{background:#10241c;border:1px solid #315846;border-radius:12px;padding:16px 18px;margin:0 0 28px;color:#c8e8d9}.panel{background:linear-gradient(145deg,#13241d,#0d1713);border:1px solid var(--line);border-radius:22px;padding:32px;display:grid;grid-template-columns:1fr 1fr;gap:34px;box-shadow:0 25px 80px #0005}h2{font-size:28px;letter-spacing:-.03em;margin:8px 0}.muted,article p{color:var(--muted)}form{display:grid;gap:14px}label{display:grid;gap:6px;font-size:13px;color:var(--muted)}input{width:100%;background:#07100d;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:13px;font:inherit}input:focus{outline:2px solid var(--mint);outline-offset:1px}button{border:0;border-radius:10px;background:var(--mint);color:#07100d;font-weight:800;padding:14px;cursor:pointer}button:disabled{opacity:.6}.result{grid-column:1/-1;border-left:4px solid var(--mint);background:#07100d;border-radius:8px;padding:18px;min-height:96px}.result.allow{border-color:var(--mint)}.result.review{border-color:var(--orange)}.result.block,.result.error{border-color:var(--red)}.result p{color:var(--muted);margin:6px 0}.result ul{margin:10px 0;padding-left:22px}.result details{margin-top:12px}.result pre,.code-card pre{white-space:pre-wrap;word-break:break-word;overflow:auto;background:#050b09;border:1px solid var(--line);border-radius:8px;padding:16px;color:#c8e8d9}.grid,.docs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:32px 0 64px}.grid article{border-top:1px solid var(--line);padding:22px 4px}.grid span,.doc-card span{color:var(--orange);font-size:12px;font-weight:800}.grid h3{margin:14px 0 4px}.doc-card,.code-card{background:linear-gradient(145deg,#13241d,#0d1713);border:1px solid var(--line);border-radius:16px;padding:24px}.doc-card h2{font-size:20px;overflow-wrap:anywhere}.code-card{margin-bottom:28px}.status-list{display:grid;gap:14px;margin:10px 0 30px}.status-list article{display:flex;gap:16px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px}.status-list p{margin:4px 0 0}.status-dot{width:12px;height:12px;border-radius:99px;margin-top:6px;background:var(--orange);flex:none}.status-dot.ok{background:var(--mint)}.status-dot.bad{background:var(--red)}footer{border-top:1px solid var(--line);padding:26px 0 42px;color:var(--muted);font-size:13px}@media(max-width:760px){main{width:min(100% - 24px,1120px)}.hero,.subhero{padding:48px 0 32px}.panel{grid-template-columns:1fr;padding:22px;gap:24px}.grid,.docs-grid{grid-template-columns:1fr;padding-bottom:42px}h1,h1.compact{font-size:46px}.lead{font-size:18px}}`;

export const demoJs = `const form=document.querySelector("#preflight");const result=document.querySelector("#result");const title=document.querySelector("#result-title");const summary=document.querySelector("#result-summary");const findings=document.querySelector("#result-findings");const details=document.querySelector("#result-details");const json=document.querySelector("#result-json");const usdc="0x3600000000000000000000000000000000000000";const messages={ALLOW:"已通过当前检查，可以交给钱包继续确认。",REVIEW:"信息不足或存在未知项，请补充信息后复核。",BLOCK:"发现明确风险，不应签名或发送。"};const clear=()=>{findings.replaceChildren();details.hidden=true;json.textContent=""};const show=(kind,heading,message)=>{result.className="result "+kind;title.textContent=heading;summary.textContent=message};const stale=(message)=>{clear();show("review","结果已失效",message)};form.addEventListener("input",()=>stale("输入已改变，请重新运行检查。"));form.addEventListener("invalid",()=>stale("请先修正无效输入，再运行检查。"),true);const units=(v)=>{if(!/^\\d+(\\.\\d{0,6})?$/.test(v))throw new Error("金额必须是正数，最多 6 位小数。");const [w,f=""]=v.split(".");const value=BigInt(w)*1000000n+BigInt((f+"000000").slice(0,6));if(value<=0n)throw new Error("金额必须大于零。");return value.toString()};const address=(v,label)=>{if(!/^0x[0-9a-fA-F]{40}$/.test(v))throw new Error(label+"不是有效的 EVM 地址。");return v};const pad=(v)=>v.slice(2).toLowerCase().padStart(64,"0");form.addEventListener("submit",async(e)=>{e.preventDefault();const button=form.querySelector("button");button.disabled=true;clear();show("neutral","正在检查","正在解析交易并检查 Arc 测试网策略…");try{const recipient=address(document.querySelector("#recipient").value.trim(),"收款地址");const payerValue=document.querySelector("#payer").value.trim();const payer=payerValue?address(payerValue,"付款人公开地址"):"";const amount=units(document.querySelector("#amount").value.trim());const limit=units(document.querySelector("#limit").value.trim());const data="0xa9059cbb"+pad(recipient)+BigInt(amount).toString(16).padStart(64,"0");const intent={action:"transfer",expectedRecipient:recipient,expectedAssetAddress:usdc,expectedAmountMicroUsdc:amount,purpose:"LedgerGuard browser demo"};if(payer)intent.expectedDebitAddress=payer;const payload={network:"arcTestnet",to:usdc,data,valueWei:"0",intent,policy:{requireSimulation:Boolean(payer),maxAmountMicroUsdc:limit}};if(payer)payload.from=payer;const response=await fetch("/v1/preflight",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const body=await response.json();if(!response.ok)throw new Error(body.message||body.error||"请求失败");show(body.decision.toLowerCase(),body.decision,messages[body.decision]||"检查完成。");for(const item of body.findings||[]){const li=document.createElement("li");li.textContent=item.code+"："+item.message;findings.append(li)}if(!body.findings?.length){const li=document.createElement("li");li.textContent="收款人、资产、金额、付款人和模拟均未发现已知问题。";findings.append(li)}json.textContent=JSON.stringify(body,null,2);details.hidden=false}catch(error){show("error","检查失败",error instanceof Error?error.message:"未知错误");}finally{button.disabled=false}});`;
