# LedgerGuard — one-page partner brief

Last updated: 2026-08-04
Demo: https://ledgerguard-gules.vercel.app
Repository: https://github.com/lw22336599-rgb/ledgerguard

## One line

LedgerGuard is a non-custodial control layer that checks whether a stablecoin payment matches declared intent before signing and reconciles evidence after settlement.

## What exists today

- Arc Testnet Guard Links and deterministic `ALLOW / REVIEW / BLOCK` preflight
- Post-settlement evidence reconciliation
- OpenAPI, MCP, SDK source, network registry, and developer integration surfaces
- A controlled Base Mainnet x402 canary in code, disabled unless separate public-canary gates are explicitly enabled
- A draft public Risk Signal Profile and self-test fixtures

## What is not proven

- No independently verified external integration or paying customer
- No verified production mainnet settle-deliver-reconcile loop in this repository
- No official Arc, Circle, Base, Coinbase, or x402 endorsement
- No protocol-standard authority or third-party certification program
- Testnet payments are not revenue

## Users and value

- Wallets and agents: deterministic checks before a wallet signs
- Merchants and payment links: clear recipient, amount, purpose, and limits
- Teams: policy, audit, evidence retention, and alerts after demand is validated
- Ecosystem integrators: open schemas, adapters, and conformance fixtures

## Defensible path

1. Privacy-safe, consented learning signals that demonstrably improve a fixed evaluation benchmark
2. A vendor-neutral, versioned risk vocabulary with independent implementations and upstream review
3. A governed conformance program only after independent testing, trademark rules, expiry, and revocation exist
4. OEM distribution through wallets, agents, merchants, and payment infrastructure

The public MIT repository remains the interoperable core. Proprietary datasets, models, enterprise controls, hosted operations, and SLA tooling must live in a separate private repository.

## Current ask

We seek design partners for reproducible testnet integrations and technical review. Co-marketing, paid pilots, or public mainnet activation follow only after the evidence gates in `docs/NEXT_STEPS.md` are met.
