# LedgerGuard — One-Page Pitch (English)

**Use for:** Circle/Arc grants, ecosystem partners, agent frameworks, hackathons, X posts, cold outreach.

**Last updated:** 2026-07-31  
**Demo:** https://ledgerguard-gules.vercel.app  
**Repo:** https://github.com/lw22336599-rgb/ledgerguard

---

## One line

**Non-custodial stablecoin payment intent safety for Arc — preflight before sign (ALLOW / REVIEW / BLOCK), evidence after settlement. One-line SDK (`@ledgerguard1/sdk`).**

Do **not** say: “only player”, “x402 standard author”, or “verified merchant”. See `docs/MESSAGING_AND_CLAIMS.md`.

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

Optional: **x402 testnet** paid resources and **live Base Mainnet x402** at `/canary` (0.001 USDC; production gates passed; capability proof, not a Guard Link product).

**x402 compatibility:** we map to the draft [Payment Preflight Record](https://github.com/x402-foundation/x402/pull/2792) as a compatible oracle — see `docs/PREFLIGHT_RECORD_MAPPING.md`. We complement x402 facilitators and endpoint readiness tools; we do not own the x402 specification.

---

## Why Arc-first

- USDC-native alignment with Circle's Arc ecosystem
- Agent + programmable payment narrative (x402, MCP, OpenAPI)
- Non-custodial architecture fits infra partnerships better than becoming a wallet or money transmitter
- Base Mainnet x402 is live at `/canary` (real USDC demo) — secondary to Arc, not a second product front

We are **not** building Base Mainnet Guard Links until Arc shows external usage and a credible mainnet path.

---

## What is live today (verified)

- Public demo: https://ledgerguard-gules.vercel.app/guard/create
- Guard Link E2E on Arc Testnet (create → pay → verify)
- `@ledgerguard1/sdk@0.1.0` on npm; `POST /v1/can-sign`, webhooks, `/integrations`
- 148 automated tests, production smoke PASS
- OpenAPI, MCP, `.well-known/ledgerguard.json`, developer self-service API keys
- Specification docs: Preflight Record mapping, Guard Link format, network adapters, open-source policy
- Base Mainnet x402 live at `/canary`; fail-closed Arc mainnet Guard Link gates; honest `/v1/meta` boundaries
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
4. **Wallets / exchanges** — thin `can-sign` path — see `docs/WALLET_EXCHANGE_INTEGRATION.md`  
5. **Arc ecosystem builders** — reference implementation for intent-bound USDC flows  

---

## Differentiation (specific, not generic)

| Others often do | LedgerGuard combines |
| --- | --- |
| Wallet transfer | + declared intent in the link |
| x402 paywall / endpoint readiness | + intent ↔ calldata reconciliation |
| Generic transaction scanners | + stablecoin payment intent + evidence loop |
| Custodial checkout | **Non-custodial** — we never hold keys |

We do **not** claim to be the only payment or preflight product in crypto. We claim a narrow wedge: **link + intent reconciliation + preflight + evidence on Arc**, x402-compatible mapping.

---

## Integration surface (30 minutes)

```text
npm install @ledgerguard1/sdk
POST /v1/can-sign              → thin wallet preflight
POST /v1/preflight             → full ALLOW / REVIEW / BLOCK
POST /v1/evidence              → VERIFIED vs intent
POST /v1/guard-links           → create shareable Guard Link
GET  /guard?...                  → human payment request page
GET  /v1/network-adapters        → enabled networks (fail-closed)
```

See `docs/PARTNER_INTEGRATION_GUIDE.md` and `docs/INTEGRATION_STACK.md`.

---

## What we are asking for (partners & grants)

**Not asking for:** token launch, custody, or revenue projections without pilots.

**Asking for:**

1. **Design partners** — 1–3 agent or merchant projects to integrate on Arc Testnet  
2. **Technical review** — Arc + USDC + x402 integration feedback  
3. **Co-marketing** — after public, reproducible integration evidence exists  
4. **Milestone funding** — to harden evidence standards, audits, and Arc mainnet readiness  

**Grant submit:** https://circle.questbook.app/ (program: https://www.circle.com/grant)

---

## Traction milestones (next 90 days)

| Milestone | Target |
| --- | --- |
| Payment intent safety messaging + spec docs | Done |
| Legal/trust pages (Privacy, Terms, About) | Done |
| First external testnet integration | 1 project |
| Repeat use on 2+ days | Documented |
| Published integration guide + pitch | Done |
| Circle Developer Grant submission (Questbook) | In progress |

---

## Team & contact

Independent developer project (not a registered company).  
Open source. English-first public product.

- **Email:** lw22336599@gmail.com  
- **X:** https://x.com/HuiLibaa  
- **GitHub:** https://github.com/lw22336599-rgb/ledgerguard  

---

## 30-second spoken version

> LedgerGuard provides stablecoin payment intent safety on Arc Testnet.  
> You create a Guard Link; the payer reviews amount, recipient, and purpose before signing.  
> Developers use `@ledgerguard1/sdk` for preflight and evidence; we map to the draft x402 Preflight Record as a compatible oracle.  
> We are non-custodial, Arc-first, and honest about testnet scope — no paying customers until external evidence exists.

---

## Safe claims checklist (before you send)

- [ ] Said **Arc Testnet** where money is involved  
- [ ] Did **not** claim paying customers, platform fees, or “x402 standard author”  
- [ ] Described **ALLOW** as checks passed, not guaranteed safety  
- [ ] Positioned Base as **bounded demo**, not equal Guard Link product  
- [ ] Linked **`/guard/create`**, npm SDK, or docs — not vague "mainnet live"
