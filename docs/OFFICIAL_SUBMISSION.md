# Official ecosystem submission pack

This file is copy-ready source material. Replace bracketed identity/contact
fields with truthful information before submitting any external form.

## Project

**Name:** LedgerGuard

**URL:** https://ledgerguard-gules.vercel.app

**Repository:** https://github.com/lw22336599-rgb/ledgerguard

**Category:** Agentic payments / developer tools / payment safety

**One-line description:** Non-custodial Arc transaction preflight, settlement
evidence, and x402-paid risk data for autonomous agents.

## Problem and differentiation

Autonomous agents need a machine-verifiable checkpoint between deciding to pay
and asking a wallet to sign. LedgerGuard compares unsigned Arc transaction
calldata with a declared intent and policy, optionally simulates it, and returns
an `ALLOW`, `REVIEW`, or `BLOCK` decision. It also normalizes post-settlement
evidence and exposes an x402-paid Arc Testnet resource.

LedgerGuard complements Circle's payment and wallet infrastructure; it does not
replace it, custody funds, or duplicate a general payment SDK.

## Current evidence

- Public testnet deployment and OpenAPI document
- Live Arc Testnet chain-ID/readiness verification
- Browser preflight demo requiring no wallet
- Circle Gateway x402 v2 payment challenge on Arc Testnet
- Mainnet fail-closed release gate
- Automated tests, build/type checks, production smoke test, and hourly uptime
  workflow

There are currently no claims of paying customers, production mainnet volume,
or guaranteed revenue.

## Requested support

- Technical review of Arc and Circle Gateway integration
- Listing in the relevant Circle agent-service and Arc ecosystem surfaces
- Testnet design partners and developer feedback
- Eligibility guidance for grants, co-marketing, and mainnet launch support

## Milestones

1. Validate discovery-to-402-to-settlement with testnet design partners.
2. Publish SDK examples and measure successful integrations and repeat calls.
3. Complete a security review and global rate-limit/billing controls.
4. Run official-parameter conformance and read-only shadow traffic for mainnet.
5. Launch a mainnet canary only after explicit release approval.

## Required human fields

- Applicant name: `[REQUIRED]`
- Contact email: `[REQUIRED]`
- Legal entity, if any: `[OPTIONAL — do not invent]`
- Country/region: `Singapore`
- Requested funding and milestone budget: `[REQUIRED FOR GRANT APPLICATION]`
