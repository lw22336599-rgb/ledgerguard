# LedgerGuard product blueprint: 2026-2031

## One-sentence strategy

LedgerGuard should become the non-custodial control layer between an intent to
transact and the final signature or settlement: normalize intent, apply
deterministic policy, return ALLOW / REVIEW / BLOCK, and verify what happened.

Arc, Base, x402, AP2, ACP, A2A, MCP, wallets, and future rails are adapters.
None of them is the company by itself.

## Product demonstration

```text
human / AI agent / application
            |
            v
  protocol or wallet adapter
            |
            v
  canonical control envelope
  intent + actor + network + asset + amount + purpose
            |
            v
 deterministic policy and simulation
      ALLOW / REVIEW / BLOCK
            |
            v
 wallet or payment rail signs outside LedgerGuard
            |
            v
 post-settlement evidence receipt
```

The first protocol-neutral schemas are in
`src/domain/control-envelope.ts`. They are deliberately small. New adapters map
into this envelope instead of rewriting the core engine.

## Who receives value and who pays

| Surface | User value | Likely payer |
| --- | --- | --- |
| Guard Link / receipt viewer | Understand who pays whom, how much, why, and the risk result | Free distribution surface |
| SDK / API / MCP | Add a pre-sign control step without custody | Developer or application team |
| Team policy console | Budgets, allowlists, review queues, evidence retention, alerts | Operations/security team |
| OEM / managed adapters | Embedded control layer, maintained compatibility, SLA | Wallet, exchange, payment provider |

Ordinary users should not type raw addresses and policy limits. A merchant,
wallet, or agent pre-fills the intent; the user reviews plain language and opens
technical evidence only when needed.

## Eight durable assets

1. A stable, protocol-neutral control envelope.
2. Deterministic policy and evidence conformance tests.
3. Maintained adapters with explicit maturity status.
4. Hosted operational data and evidence history.
5. Distribution through wallets, agent frameworks, payment providers, and
   implementation partners.
6. An opt-in, privacy-safe data flywheel with provenance, labels, corrections,
   and measured false-positive and false-negative rates.
7. A versioned risk-signal profile, public conformance fixtures, and upstream
   protocol-extension participation earned through independent adoption.
8. An enforceable LedgerGuard brand and certification program introduced only
   after independent testing and governance gates exist.

## Phased execution

### Horizon 0: truth and release control (now to 30 days)

- align local, GitHub, and production revisions;
- remove contradictory claims and quarantine invalid evidence;
- restore green tests, build, dependency audit, smoke, and release provenance;
- publish the canonical envelope and contribution rules;
- publish the risk-signal draft, self-test fixtures, and privacy-safe telemetry
  contract without claiming standard ownership or certification;
- obtain three external developer integrations, one repeat user, and one
  written paid-pilot signal.

Gate: remain public preview / HOLD if external use and payment intent are absent.

### Horizon 1: focused product (1-6 months)

- one excellent Guard Link review flow;
- hosted API, SDK, and MCP using the same policy core;
- durable tenant, usage, evidence, and billing records;
- two production-quality adapters chosen by buyer demand, not hype;
- measured activation, protected transactions, repeat use, and conversion.
- opt-in outcome feedback with data provenance, deletion, correction, and
  baseline precision/recall reporting.

Gate: no broad mainnet marketing until a bounded settlement, rollback, and
reconciliation test is independently reproducible.

### Horizon 2: platform (6-18 months)

- team policy console and audit exports;
- adapter conformance kit and partner implementation program;
- threat-data and identity integrations with provenance and freshness controls;
- paid OEM pilots with wallets, agents, or payment platforms.
- prototype a thin x402 risk-signal extension and seek upstream review; claim
  standards influence only after public acceptance and independent use.

Gate: add a new rail only when an integration partner or repeated inbound demand
justifies its maintenance cost.

### Horizon 3: ecosystem (18-36 months)

- public adapter marketplace with Community and Conformant tiers;
- paid certification, managed hosting, and OEM distribution;
- cash bounties and implementation-partner revenue for contributors;
- protocol mappings maintained as thin adapters around the stable core.
- launch a LedgerGuard Conformant mark only after the gates in
  `CONFORMANCE.md` pass.

### Horizon 4: 3-5 year option

If usage proves the category, LedgerGuard can become a vendor-neutral trust and
evidence layer used across agent commerce and wallet payment flows. Acquisition,
token issuance, or a foundation are options only after defensible usage,
governance, legal review, and revenue exist. They are not current milestones.

## Commercial gates

Development beyond the focused product requires all of:

- 3 non-project developers independently integrated;
- 1 real application or agent repeats use on at least two days;
- 100 attributable non-project calls;
- 1 written paid-pilot or subscription commitment;
- no known critical security defect;
- service delivery cost below collected or credibly committed revenue.

If 20 qualified partner conversations do not produce three integrations and one
paid signal, stop adding generic features. Reassess the buyer, wedge, and
distribution channel.

## Explicit non-goals

- custody, autonomous signing, or AI override of deterministic policy;
- building a bridge, wallet, payment rail, or new chain;
- supporting every chain before demand;
- issuing a token to substitute for customers;
- promising passive, maintenance-free, or guaranteed revenue;
- treating ecosystem listings, stars, impressions, or test tokens as PMF.
