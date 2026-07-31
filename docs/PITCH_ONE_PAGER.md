# LedgerGuard — One-Page Pitch (English)

**Use for:** Circle/Arc grants, ecosystem partners, agent frameworks, hackathons, X posts, cold outreach.

**Last updated:** 2026-07-31  
**Demo:** https://ledgerguard-gules.vercel.app  
**Repo:** https://github.com/lw22336599-rgb/ledgerguard

---

## One line

**LedgerGuard is a non-custodial USDC payment safety layer for Arc — humans and agents review intent before signing, then reconcile onchain evidence after settlement.**

---

## Problem

Autonomous agents and payment links share the same failure mode: **the wallet prompt is opaque**. Users and operators cannot easily answer:

- Who receives the funds?
- How much USDC can move?
- Does the signed transaction match what was declared?
- Were there unexpected approvals or side transfers?

Wallets sign. They do not standardize **intent → transaction → evidence**.

---

## Solution

LedgerGuard adds three layers **without custody**:

| Layer | What it does | Status |
| --- | --- | --- |
| **Guard Link** | Shareable URL/QR with human-readable payment request | Arc Testnet — primary product |
| **Preflight API** | Deterministic `ALLOW` / `REVIEW` / `BLOCK` before signing | Arc Testnet + developer API |
| **Evidence API** | Post-settlement reconciliation vs declared intent | Arc Testnet |

Optional: **x402 testnet** paid resources and a **bounded Base Mainnet x402 demo** at `/canary` (capability proof, not a Guard Link product).

---

## Why Arc-first

- USDC-native alignment with Circle's Arc ecosystem
- Agent + programmable payment narrative (x402, MCP, OpenAPI)
- Non-custodial architecture fits infra partnerships better than becoming a wallet or money transmitter
- Base remains a secondary, bounded real-USDC demo — not a second product front

We are **not** building Base Mainnet Guard Links until Arc shows external usage and a credible mainnet path.

---

## What is live today (verified)

- Public demo: https://ledgerguard-gules.vercel.app/guard/create
- Guard Link E2E on Arc Testnet (create → pay → verify)
- 134 automated tests, production smoke PASS
- OpenAPI, MCP, `.well-known/ledgerguard.json`, developer self-service API keys
- Fail-closed mainnet gates; honest `/v1/meta` boundaries
- Privacy, Terms, About pages published

**Honest limits today:**

- 0 externally verified integrations
- 0 paying customers
- 0 platform fee on Guard Link transfers (direct wallet USDC)
- Arc Testnet assets have no financial value

---

## Who this is for

1. **Agent frameworks** — preflight before `eth_sendTransaction`, evidence after settlement  
2. **Merchant / freelancer tools** — Guard Link instead of "paste my address"  
3. **x402 resource sellers** — pattern reference for paid + reconciled delivery  
4. **Arc ecosystem builders** — reference implementation for intent-bound USDC flows  

---

## Differentiation (specific, not generic)

| Others often do | LedgerGuard combines |
| --- | --- |
| Wallet transfer | + declared intent in the link |
| x402 paywall | + evidence reconciliation |
| Policy engines | + human-readable Guard Link for payers |
| Custodial checkout | **Non-custodial** — we never hold keys |

We do **not** claim to be the only payment app in crypto. We claim a narrow wedge: **link + preflight + evidence on Arc**.

---

## Integration surface (30 minutes)

```text
POST /v1/guard-links          → create shareable Guard Link
GET  /guard?...               → human payment request page
POST /v1/preflight            → ALLOW / REVIEW / BLOCK
POST /v1/evidence             → VERIFIED vs intent
POST /v1/developer/preflight  → authenticated, metered
POST /mcp                       → agent tools (read-only)
GET  /v1/paid/network-risk      → x402 Arc testnet demo
```

See `docs/PARTNER_INTEGRATION_GUIDE.md` for a step-by-step partner path.

---

## What we are asking for (partners & grants)

**Not asking for:** token launch, custody, or revenue projections without pilots.

**Asking for:**

1. **Design partners** — 1–3 agent or merchant projects to integrate on Arc Testnet  
2. **Technical review** — Arc + USDC + x402 integration feedback  
3. **Co-marketing** — after public, reproducible integration evidence exists  
4. **Milestone funding** — to harden evidence standards, audits, and Arc mainnet readiness  

---

## Traction milestones (next 90 days)

| Milestone | Target |
| --- | --- |
| Public Arc-first launch messaging | Done |
| Legal/trust pages (Privacy, Terms, About) | Done |
| First external testnet integration | 1 project |
| Repeat use on 2+ days | Documented |
| Published integration guide + pitch | Done |
| Optional Circle Developer Grant submission | In progress |

---

## Team & contact

Independent developer project (not a registered company).  
Open source. English-first public product.

- **Email:** lw22336599@gmail.com  
- **X:** https://x.com/HuiLibaa  
- **GitHub:** https://github.com/lw22336599-rgb/ledgerguard  

---

## 30-second spoken version

> LedgerGuard helps people and agents pay with USDC more safely on Arc Testnet.  
> You create a Guard Link; the payer sees a clear payment request before signing.  
> Developers get preflight and evidence APIs; agents can use MCP.  
> We are non-custodial, Arc-first, and honest about testnet scope.

---

## Safe claims checklist (before you send)

- [ ] Said **Arc Testnet** where money is involved  
- [ ] Did **not** claim paying customers or platform fees  
- [ ] Described **ALLOW** as checks passed, not guaranteed safety  
- [ ] Positioned Base as **bounded demo**, not equal Guard Link product  
- [ ] Linked **`/guard/create`** or docs, not vague "mainnet live"
