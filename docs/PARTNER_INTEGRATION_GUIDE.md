# Partner Integration Guide — 30-Minute Arc Testnet Path

**Audience:** Agent frameworks, bot platforms, merchant tools, Arc ecosystem projects  
**Production base URL:** https://ledgerguard-gules.vercel.app  
**Deeper reference:** `INTEGRATION.md`, `SDK_MCP_QUICKSTART.md`, `openapi.json`

---

## What you integrate

LedgerGuard is **non-custodial**. You (or your user's wallet) always sign. We provide:

1. **Guard Link** — human-readable payment request (URL / QR)  
2. **Preflight** — `ALLOW` / `REVIEW` / `BLOCK` before signing  
3. **Evidence** — reconcile a confirmed tx against declared intent  

**Primary network:** Arc Testnet (`eip155:5042002`, chain ID `5042002`)  
**USDC (Arc Testnet):** `0x3600000000000000000000000000000000000000`

---

## Choose your path

| Your product | Start here | Time |
| --- | --- | --- |
| Human payer / merchant | [Path A — Guard Link](#path-a--guard-link-human-flow) | ~10 min |
| Agent / backend | [Path B — Preflight + Evidence](#path-b--preflight--evidence-agent-flow) | ~20 min |
| Agent with MCP | [Path C — MCP tools](#path-c--mcp-read-only-tools) | ~25 min |
| x402 buyer experiment | [Path D — x402 testnet](#path-d--x402-testnet-optional) | ~30 min |

---

## Prerequisites

- Arc Testnet RPC access (public: `https://rpc.testnet.arc.network`)
- Test USDC on Arc ([Circle faucet](https://faucet.circle.com/) — select Arc Testnet)
- EVM wallet or server-side signing for your own txs only — **never send us private keys**

---

## Path A — Guard Link (human flow)

**Best for:** Invoices, tips, chat payments, QR in UI.

### A1. Create a link (API)

```bash
curl -X POST https://ledgerguard-gules.vercel.app/v1/guard-links \
  -H "content-type: application/json" \
  -d '{
    "issuer": "Acme Agent",
    "recipient": "0xYourRecipientAddress",
    "amount": "1.00",
    "limit": "1.00",
    "purpose": "Invoice 42",
    "expires": "2030-01-01T00:00:00.000Z"
  }'
```

Response (`201`):

```json
{
  "url": "https://ledgerguard-gules.vercel.app/guard?...",
  "intentId": "abc123...",
  "network": "arcTestnet",
  "custody": "none"
}
```

Share `url` or encode it as a QR code. The server **never signs**.

### A2. Payer flow (browser)

1. Open `url`
2. Review payment request (`ALLOW` / `REVIEW` / `BLOCK`)
3. Connect wallet → approve Arc Testnet USDC transfer
4. Click verify evidence → `VERIFIED` if tx matches intent

### A3. Your app records

Store `intentId`, `url`, and the payer's public `txHash` for support and audit.

---

## Path B — Preflight + Evidence (agent flow)

**Best for:** Autonomous agents that construct ERC-20 `transfer` calldata.

### B1. Register a test API key (optional but recommended)

1. Open https://ledgerguard-gules.vercel.app/developer  
2. Create a key (shown once): `lg_test_...`  
3. Pick a public integration id, e.g. `acme-agent-testnet`

Send on authenticated routes:

```http
Authorization: Bearer lg_test_...
X-LedgerGuard-Integration: acme-agent-testnet
X-LedgerGuard-Client: acme-agent/1.0
```

### B2. Preflight before signing

```bash
curl -X POST https://ledgerguard-gules.vercel.app/v1/preflight \
  -H "content-type: application/json" \
  -d '{
    "network": "arcTestnet",
    "from": "0xPayerAddress",
    "to": "0x3600000000000000000000000000000000000000",
    "data": "0x...",
    "valueWei": "0",
    "intent": {
      "action": "transfer",
      "expectedDebitAddress": "0xPayerAddress",
      "expectedRecipient": "0xMerchantAddress",
      "expectedAssetAddress": "0x3600000000000000000000000000000000000000",
      "expectedAmountMicroUsdc": "1000000",
      "purpose": "Invoice 42"
    },
    "policy": {
      "maxAmountMicroUsdc": "1000000",
      "allowUnlimitedApproval": false,
      "requireSimulation": true
    }
  }'
```

**Fail-closed rule:** Only proceed to wallet signing if `decision === "ALLOW"`.

Save `X-LedgerGuard-Request-Id` from the response headers.

### B3. Sign and broadcast (your wallet)

LedgerGuard does not broadcast. Your agent or user wallet sends the transaction.

### B4. Evidence after confirmation

```bash
curl -X POST https://ledgerguard-gules.vercel.app/v1/evidence \
  -H "content-type: application/json" \
  -d '{
    "network": "arcTestnet",
    "txHash": "0x...",
    "intent": {
      "action": "transfer",
      "expectedDebitAddress": "0xPayerAddress",
      "expectedRecipient": "0xMerchantAddress",
      "expectedAssetAddress": "0x3600000000000000000000000000000000000000",
      "expectedAmountMicroUsdc": "1000000",
      "purpose": "Invoice 42"
    }
  }'
```

Success: `"status": "VERIFIED"`.

### B5. Quick local repro (repo clone)

```powershell
$env:LEDGERGUARD_API_KEY = "lg_test_..."
$env:LEDGERGUARD_INTEGRATION = "your-public-project-testnet"
node examples/quickstart.mjs
```

---

## Path C — MCP read-only tools

**Endpoint:**

```text
POST https://ledgerguard-gules.vercel.app/mcp
Authorization: Bearer lg_test_...
```

**Tools (read-only, no signing):**

- `ledgerguard_preflight`
- `ledgerguard_shadow` — evaluation only, never authorizes spend
- `ledgerguard_evidence`

Each call consumes test quota. See `SDK_MCP_QUICKSTART.md` for tool schemas.

---

## Path D — x402 testnet (optional)

**Endpoint:** `GET /v1/paid/network-risk`  
Returns `402` + `PAYMENT-REQUIRED` for Arc Testnet USDC via Circle Gateway x402.

This validates **paid resource + settlement receipt** patterns. It is not required for Guard Link integrations.

Repo helper:

```powershell
npm run x402:buyer:init
npm run x402:buyer -- pay
```

Evidence: `docs/X402_E2E_EVIDENCE.md`.

**Separate:** Base Mainnet bounded demo at `/canary` — real USDC, not Arc Guard Link.

---

## Integration patterns

### Pattern 1 — Agent sells a task

1. Agent creates Guard Link for task fee → sends URL to user  
2. User pays on `/guard` page  
3. Agent polls evidence API or user returns `txHash`  
4. Agent delivers work only after `VERIFIED`

### Pattern 2 — Agent spends autonomously

1. Agent builds unsigned USDC transfer  
2. `POST /v1/preflight` → must be `ALLOW`  
3. Agent wallet signs (policy-controlled)  
4. `POST /v1/evidence` → log `VERIFIED` for audit trail

### Pattern 3 — Hybrid

- Guard Link for human approval  
- Preflight/evidence for backend reconciliation  
- Same `intent` shape on both paths

---

## Attribution (counts as external validation)

To appear in our public adoption metrics:

1. Use a **public** `X-LedgerGuard-Integration` id (not a secret)  
2. Save response `X-LedgerGuard-Request-Id` values or public tx hashes  
3. Open a GitHub issue: **Independent integration evidence**  
   — Repo: https://github.com/lw22336599-rgb/ledgerguard/issues  
4. Include: your project name, integration id, repro steps, 1+ request id or tx hash  

See `EXTERNAL_VALIDATION.md` for the full gate.

---

## Error handling (fail closed)

| Response | Meaning | Action |
| --- | --- | --- |
| `BLOCK` | Policy or decode failure | Do not sign |
| `REVIEW` | Missing payer / simulation skipped | Require human review |
| `ALLOW` | Checks passed | May sign — still show wallet prompt |
| Evidence not `VERIFIED` | Tx mismatch or indexing lag | Retry; do not treat as paid |

**Never** treat `ALLOW` as "safe to sign blindly."

---

## Test checklist before you ship

- [ ] Recipient address uses valid EIP-55 checksum in API requests  
- [ ] Amounts use USDC strings with ≤6 decimals  
- [ ] Guard Link `expires` is ISO-8601 with timezone offset  
- [ ] Payer address set when you require simulation  
- [ ] Evidence called only after tx confirmation  
- [ ] Integration id sent on authenticated routes  
- [ ] Public copy says **Arc Testnet** for Guard Links  

---

## Limits (honest)

- No LedgerGuard custody or signing  
- No merchant KYC — issuer names are self-declared  
- No platform fee on Guard Link transfers today  
- Arc Mainnet Guard Links: not live until official Arc mainnet + our gates  
- Base Guard Link product: **not on roadmap** until Arc external usage exists  

---

## Support

- **Email:** lw22336599@gmail.com  
- **Docs:** https://ledgerguard-gules.vercel.app/docs  
- **OpenAPI:** https://ledgerguard-gules.vercel.app/openapi.json  
- **Status:** https://ledgerguard-gules.vercel.app/status  

For grants or partnerships, attach `docs/PITCH_ONE_PAGER.md`.
