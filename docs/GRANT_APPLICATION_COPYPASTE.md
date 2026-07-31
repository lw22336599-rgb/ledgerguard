# Circle Developer Grant — copy-paste application pack

**Submit proposals:** https://circle.questbook.app/ (Circle Developer Grants on Questbook)  
**Program info:** https://www.circle.com/grant  
**Status:** Ready to paste — background optional edit, then submit on Questbook  
**Last updated:** 2026-07-31  
**Founder:** Lao Wang (independent developer)

---

## Before you click Submit

| Field | Value |
| --- | --- |
| Applicant / founder name | **Lao Wang** |
| Team background | See **Team** section below (edit if needed) |
| Requested USDC total | **USD 35,000** (milestone split below) |
| Legal entity | Independent developer / no registered company |

---

## Short description (≈280 characters)

Non-custodial Arc USDC payment safety: Guard Links for human-readable payment requests, preflight API (ALLOW/REVIEW/BLOCK), post-settlement evidence, and x402 testnet resources — no custody, no private keys.

---

## Project name

LedgerGuard

---

## Website

https://ledgerguard-gules.vercel.app

---

## Repository

https://github.com/lw22336599-rgb/ledgerguard

---

## Category / use case

**Agentic economic activity** + developer tooling / payment safety

---

## Long description (paste into “tell us about your project”)

LedgerGuard is a non-custodial payment safety layer for USDC on **Arc Testnet**. It helps humans and autonomous agents answer one question before signing: *does this transaction match what we intended?*

**Product (live today on Arc Testnet):**

1. **Guard Link** — merchant creates a shareable URL/QR; payer reviews amount, recipient, and purpose on a payment request page before approving in their wallet.
2. **Preflight API** — compares unsigned calldata to a declared intent and policy; returns deterministic `ALLOW`, `REVIEW`, or `BLOCK`.
3. **Evidence API** — after settlement, reconciles onchain transfers against the original intent.
4. **npm SDK** — `@ledgerguard1/sdk` on npm (preflight, can-sign, withPreflight guard)
5. **x402** — Arc Testnet paid resource at `GET /v1/paid/network-risk`; Base Mainnet x402 live at `/canary` (0.001 USDC; separate capability demo, not a Guard Link product).

LedgerGuard **complements** Circle infrastructure (Arc, USDC, Gateway x402). It does not custody funds, replace wallets, or claim paying customers today.

**Verified evidence (2026-07-31):**

- Public deployment + OpenAPI 3.1
- 148 automated tests; production smoke PASS
- `@ledgerguard1/sdk@0.1.0` published on npm
- Arc Testnet readiness (`/ready` chain 5042002)
- Guard Link E2E on Arc Testnet
- Circle Gateway x402 challenge on Arc Testnet (402 → settle → deliver)
- Base Mainnet x402 operational at `/canary` (production gates passed)
- Privacy, Terms, About published; open source

**Honest limits:** 0 externally verified integrations, 0 paying customers, 0 revenue. Arc Testnet assets have no financial value.

---

## Why Arc and Circle are core (not optional)

- Arc Testnet is the **primary execution network** for Guard Links and APIs.
- USDC is the product-denominated asset throughout.
- Circle Gateway x402 powers the testnet paid-resource flow we document end-to-end.
- We are **Arc-first**: Base Mainnet is a secondary x402 demo at `/canary`, not a second product front.

---

## Traction (honest)

| Metric | Today |
| --- | --- |
| Externally verified integrations | 0 |
| Paying customers | 0 |
| Revenue | USD 0 |
| Public demo & docs | Live |
| Open source | Yes |

**Credible path:** recruit 1–3 design partners on Arc Testnet; publish reproducible integration evidence (request IDs + public repos); repeat use on 2+ days.

---

## Requested Circle support

1. Technical review of Arc + USDC + Gateway x402 integration  
2. Introductions to 2+ design partners (agent frameworks, merchant tools)  
3. Milestone-based USDC funding for production controls (rate limits, evidence ledger, monitoring, security review)  
4. Ecosystem listing / co-marketing **after** independent integration evidence exists  
5. Guidance on Arc mainnet parameters when available  

---

## Proposed milestones (USD 35,000 total)

### Milestone 1 — Independent testnet integrations — **USD 14,000**

- Two non-affiliated teams complete preflight + evidence on Arc Testnet  
- At least one completes discovery → x402 402 → settlement → delivery  
- Public integration guide + example repos linked from GitHub issues  

**Deliverable:** documented request IDs, partner names (with permission), failure log.

### Milestone 2 — Production controls — **USD 12,250**

- Persistent evidence / idempotency ledger  
- Global rate limiting and developer usage accounting  
- Monitoring + 7-day reliability report  
- External security review; critical findings resolved  

### Milestone 3 — Arc mainnet readiness — **USD 8,750**

- Official Arc mainnet parameters verified from two sources  
- Read-only shadow traffic + conformance tests  
- Human-approved release + rollback runbook  
- Arc mainnet Guard Links stay disabled until Circle review + explicit approval  

(Base Mainnet x402 at `/canary` remains a separate live x402 demo, not a Guard Link product.)

---

## Funding summary (for grant form)

**Total requested:** USD 35,000 USDC (milestone-based disbursement)

---

## Team (copy-paste for grant form)

**Founder:** Lao Wang  
**Location:** Singapore  
**Entity:** Independent developer project (open source); no token; no platform fee on Guard Links  

**Background:** Solo founder of LedgerGuard. Built and shipped the public Arc Testnet demo end-to-end: Guard Links, preflight/evidence APIs, `@ledgerguard1/sdk` on npm, Circle Gateway x402 integration, MCP/OpenAPI surfaces, 148 automated tests, and production smoke checks. Arc-first strategy — Base Mainnet x402 at `/canary` is a separate live demo, not the Guard Link product. Seeking Circle design partners and milestone funding to harden production controls and recruit independent testnet integrations.

**Contact:** lw22336599@gmail.com · X @HuiLibaa · GitHub lw22336599-rgb  

---

## Links to attach

| Label | URL |
| --- | --- |
| Demo | https://ledgerguard-gules.vercel.app/guard/create |
| Docs | https://ledgerguard-gules.vercel.app/docs |
| OpenAPI | https://ledgerguard-gules.vercel.app/openapi.json |
| Integration guide | https://github.com/lw22336599-rgb/ledgerguard/blob/main/docs/DEVELOPER_INTEGRATION_INVITE.md |
| npm SDK | https://www.npmjs.com/package/@ledgerguard1/sdk |
| x402 evidence doc | https://github.com/lw22336599-rgb/ledgerguard/blob/main/docs/X402_E2E_EVIDENCE.md |
| About | https://ledgerguard-gules.vercel.app/about |

---

## Submission checklist

- [x] Founder name: **Lao Wang**
- [x] Total ask: **USD 35,000** (14,000 + 12,250 + 8,750)
- [ ] Background edited (optional)
- [ ] Did **not** claim paying customers or 0.5% platform fee
- [ ] Said **Arc Testnet** for Guard Links
- [ ] Said Base `/canary` is x402 demo, not Guard Link product
- [ ] Submitted at https://circle.questbook.app/ (Batch 2 open when available)
- [ ] Saved confirmation email / portal link  

---

## After submit (same week)

1. Post English tweet — `docs/outreach/X_POST_EN.md`  
2. Share demo in Arc Discord — `docs/outreach/ARC_DISCORD_POST_EN.md`  
3. Send design-partner invite — `docs/DEVELOPER_INTEGRATION_INVITE.md`  
4. Add “Grant submitted” note in your project log — do not claim approval until Circle confirms  
