# Public messaging vs internal truth

Use this guide when posting on X, applying for Circle/Arc grants, talking to
developers, or reviewing AI-generated market reports. **External copy must stay
inside the "Safe to say" column.** The "Internal truth" column is for you, the
repo, and investors who ask follow-up questions.

Last aligned with production: 2026-07-31 · Demo:
https://ledgerguard-gules.vercel.app

---

## Public one-liner (English)

> Non-custodial stablecoin payment intent safety — preflight before sign (ALLOW / REVIEW / BLOCK), evidence after settlement. Arc Testnet Guard Links + one-line SDK.

Do **not** say: “only player”, “x402 standard author”, or “verified merchant”.

---

## Golden rules

1. **Testnet is not revenue.** Arc Testnet USDC has no financial value.
2. **ALLOW is not "safe to sign blindly."** It means implemented checks passed.
3. **Fail-closed mainnet is a feature,** not embarrassment.
4. **Page views and self-tests are not customers.**
5. **Never claim fees, users, or mainnet SLA unless the code and books prove it.**

---

## Master comparison

| Topic | Safe to say (public) | Do not say (overclaim) | Internal truth |
| --- | --- | --- | --- |
| **Product one-liner** | Non-custodial stablecoin payment intent safety — review amount, recipient, and purpose before signing; evidence after settlement. | "The only payment app in crypto" / "Zero competitors" / "We define the x402 standard" | Competing wallets, x402 preflight tools, endpoint readiness, and generic scanners exist; the combo **link + intent reconciliation + evidence** is the wedge. |
| **Guard Link** | Create a Guard Link, share URL or QR, payer reviews **Payment request** on Arc Testnet. | "Instant mainnet payments" / "Built-in 0.5% platform fee" | No platform fee in code; direct wallet transfer. Arc Testnet only on the public path. |
| **Protect / preflight** | Deterministic `ALLOW` / `REVIEW` / `BLOCK` before signing; read-only simulation when payer is known. | "Guarantees funds are safe" / "Prevents all scams" | Additional safety layer only; not audit, custody, or profit guarantee. |
| **Meter / x402** | Testnet x402 flow validated; Meter module links to settlement + receipts. | "Production billing live" / "Paying customers on Meter" | `/meter` and `/receipts` bridge to arc-meter; mainnet x402 fail-closed. |
| **Mainnet** | Guard Links on Arc Testnet. Base Mainnet x402 USDC is **live and operational** at `/canary` (production gates passed, real USDC). | "Guard Link on Base Mainnet today" / "Thousands of mainnet users" | Base Guard Link product not built; first optional team settlement not required for users. |
| **Users & revenue** | Public testnet demo; join testing; developer self-service on Arc Testnet. | "Paying customers" / "Recurring revenue" / "Enterprise SLA" | 0 external verified integrations, 0 paid pilots, USD 0 (see `EXTERNAL_VALIDATION.md`). |
| **Technical proof** | Public demo, OpenAPI, smoke tests, x402 E2E evidence on testnet. | "Fully audited" / "Bank-grade certified" | Strong CI and honest boundaries; no third-party security audit claimed. |
| **Identity on Guard Link** | Issuer name is self-declared context, not verified KYC. | "Verified merchant" / "We vouch for the sender" | No independent identity verification on Guard Link today. |
| **AI / agents** | API, MCP, and x402-compatible preflight mapping; preflight before automated spend. | "Every major agent already integrated" / "We own x402 preflight standard" | Adapters published; map to draft x402 PR #2792 as compatible oracle (`docs/PREFLIGHT_RECORD_MAPPING.md`). |
| **Bundle / assets** | Browser bundles served at `/guard-builder.js`, `/wallet.js`, etc. | "Site broken because internal `*-bundle.ts` 404" | Generated `*-bundle.ts` files are build artifacts; public URLs differ and return 200. |

---

## Channel-specific copy

### X / social (English recommended)

**Hook (≤280 chars):**

> Send a USDC payment link. They review before they sign.  
> Non-custodial Guard Links on Arc Testnet — no private keys on our servers.  
> https://ledgerguard-gules.vercel.app/guard/create  
> #USDC #Web3 #x402 #ArcTestnet

**Safe bullets:**

- Create link → QR or URL → **Payment request** page
- Testnet only; no real money
- Connect wallet only when payer chooses to complete a test transfer

**Avoid:**

- "Mainnet live", "We take 0.5%", "Thousands of users"

**Bio alignment:** Product pages are English-first. If bio stays Chinese, add one English line + the same URL.

---

### Circle / Arc grant application

**Safe framing:**

- Non-custodial Arc preflight + settlement evidence
- Circle Gateway x402 testnet integration with documented E2E evidence
- Fail-closed mainnet plan and public `/v1/meta` honesty
- Ask for: technical review, design partners, milestone funding, co-marketing **after** independent integration evidence

**Avoid:**

- Revenue projections without pilots
- Claiming mainnet production today

**Reference docs:** `CIRCLE_DEVELOPER_GRANT.md`, `X402_E2E_EVIDENCE.md`

---

### Developer / integration conversations

**Safe pitch:**

1. Free `POST /v1/preflight` on Arc Testnet
2. Metered `POST /v1/developer/preflight` with revocable test API key
3. Guard Link URL for human-readable payer review
4. x402 `GET /v1/paid/network-risk` for agent payment experiments (testnet)

**Honest boundaries (say these proactively):**

- We never hold keys or sign for you
- Unknown calls and failed simulation → not ALLOW
- External validation requires public issue + request IDs (see `EXTERNAL_VALIDATION.md`)

**Avoid:**

- "Drop-in replacement for your wallet"
- "We execute payments for agents"

---

## Correcting common AI audit mistakes

When a report claims the following, use the **Correction** column in replies or
your own notes — do not adopt the claim in marketing.

| AI / audit claim | Correction |
| --- | --- |
| "guard-builder-bundle.js 404 kills the site" | Public script is `/guard-builder.js` (200). |
| "0 payment apps exist" | Wallets, x402 facilitators, and agent payment tools exist; positioning must be specific. |
| "We are the x402 preflight standard" | We map to draft PR #2792 as a **compatible oracle** — do not claim authorship. |
| "0.5% Guard Link fee implemented" | Not in codebase; no platform fee on Guard Link transfers. |
| "Open mainnet now for growth" | Contradicts safety gates and grant honesty; testnet validation first. |
| "Chinese UI required for launch" | Public product is English (`lang=en`); global audience. |
| "Smoke green = product-market fit" | Smoke = technical regression; PMF needs external users and pilots. |

---

## Elevator pitch (30 seconds, English)

LedgerGuard provides **stablecoin payment intent safety** on Arc Testnet.
Merchants create a **Guard Link**; payers see a clear **payment request** before
their wallet asks them to sign. Developers get preflight API, evidence
reconciliation, and x402-compatible mapping (see `docs/PREFLIGHT_RECORD_MAPPING.md`).
We are non-custodial, mainnet fail-closed, and honest about testnet scope — we do
not claim paying customers until external evidence exists.

---

## When you can upgrade public claims

| Milestone | New claim you may add |
| --- | --- |
| 3+ external testers with public issue + request IDs | "Independent testnet integrations verified" |
| Repeat use on 2+ days (documented) | "Repeat integration activity observed" |
| Signed pilot letter + testnet/mainnet tx evidence | "Paid pilot in progress" (scope only as written) |
| All mainnet gates green + deliberate canary tx | "Bounded Base mainnet canary completed" (not "full production") |
| Arc official mainnet + your gates | Update `/v1/networks` truthfully; still no SLA until commercial terms exist |

---

## Quick self-check before posting

- [ ] Did I say **testnet** where money is involved?
- [ ] Did I avoid **fee / revenue / user counts** unless documented?
- [ ] Did I describe **ALLOW** as checks passed, not guaranteed safety?
- [ ] Is the link **`/guard/create`** or **`/guard?...`** accurate?
- [ ] Is the post **English** for global product pages (unless targeting CN-only audience)?

If any box fails, rewrite before posting.
