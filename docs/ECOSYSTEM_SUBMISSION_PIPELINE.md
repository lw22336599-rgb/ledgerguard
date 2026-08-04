# Ecosystem submission and promotion pipeline

Last verified: 2026-08-04

This is the operating source of truth for funding, discovery, ecosystem, and
launch submissions. A listing, impression, test token, automated check, or
project-party transaction is not customer adoption or revenue.

## Priority channels

| Channel | Value | Current state | Next evidence gate |
| --- | --- | --- | --- |
| npm `@ledgerguard1/sdk` | Public installation and package discovery | **PUBLISHED AND VERIFIED**: public registry serves `0.1.1`; a clean temporary project installed the package and imported `LedgerGuardClient` successfully on 2026-08-04 | Keep examples pinned to a published compatible version; use trusted publishing for later releases instead of a long-lived token |
| Official MCP Registry | Agent/client discovery through a trusted metadata registry | **VALIDATION CANDIDATE, NOT SUBMITTED**: remote-server metadata exists in `server.json`; Registry is preview and publication requires GitHub authentication and acceptance of Registry terms | Validate `server.json` with the official publisher, owner accepts Registry terms, publish and verify search result |
| CDP x402 Bazaar | Semantic discovery of paid API resources | **HOLD**: there is no separate application form; indexing follows a successful CDP-facilitated settlement with accepted Bazaar v2 metadata | Controlled Base Sepolia settle, accepted extension response, then verify catalog/search result |
| Circle Developer Grants | Funding, technical review, co-marketing | **WATCH**: application window is currently closed | Preserve accurate pack; add applicant name and milestone budget only when window reopens; include external usage evidence if available |
| Circle Alliance Program | Ecosystem credibility and partner access | **HOLD**: intended for a live Circle-based solution or stablecoin service provider | Confirm program considers public-testnet infrastructure; otherwise wait for a qualified external integration |
| Base Builder Rewards | Early prototype exposure and activity rewards | **HOLD**: LedgerGuard must not activate Base Mainnet merely to qualify | Ship a truthful Base Sepolia integration, document attributable use, then verify the current campaign requirements |
| Base Builder Grants | Retroactive 1-5 ETH pathway for shipped Base projects | **HOLD**: no verified Base production deployment, usage, or impact | Independent Base integration and impact evidence; no application based only on a disabled canary |
| OP Retro Funding / Atlas | Open-source public-goods funding | **HOLD**: impact evidence is absent | External integrations, downstream reuse, testimonials, and measurable ecosystem impact |
| Ethereum Foundation ESP | Funding for free, open-source, non-commercial Ethereum infrastructure and developer tooling | **WATCH / SCOPE-LIMITED**: the hosted commercial service is not eligible as the grant output; a separately scoped open conformance profile, fixtures, or adapter may be | Match a current Wishlist/RFP, define only open public-good deliverables, applicant identity, milestones, budget, and ETH grant onboarding |
| Gitcoin Grants | Seasonal open-source/public-goods crowdfunding and matching | **WATCH**: eligibility and application windows vary by round; current production traffic is not impact evidence | Wait for a matching OSS/security round, then use verified GitHub activity and downstream reuse only |
| GitHub repository and Releases | Developer credibility, changelog, install entry | **PUBLISHED AND VERIFIED**: factual `sdk-v0.1.1` release links to the public package and states the public-preview limitations | Keep later release notes evidence-based and publish only versions that pass clean-room installation |
| Product Hunt / developer launch channels | Broad product exposure and feedback | **HOLD FOR EXTERNAL USE EVIDENCE**: the install path works, but independent onboarding and repeat use are not yet verified | One reproducible quickstart, one independent Sandbox integration, truthful screenshots, and a support/feedback route |

## Promotion sequence

1. Fix the install path and prove a clean-room SDK import.
2. Publish one factual release note on GitHub and X. State public preview,
   Arc Testnet, Sandbox quota, and the absence of verified commercial adoption.
3. Publish the MCP entry only after its remote installation path validates and
   the owner accepts the Registry terms for the exact submission.
4. Complete one controlled Base Sepolia x402 v2 settlement before expecting
   Bazaar indexing.
5. Invite qualified wallet, payment, and agent developers to a bounded Sandbox
   pilot; record only attributable external evidence.
6. Submit grants only when the window is open and every required applicant,
   ownership, budget, milestone, and traction field is truthful.

## Distribution evidence on 2026-08-04

- X profile is now branded as LedgerGuard, links to the production preview, and
  states the non-custodial public-preview boundary.
- Factual launch/status post published and pinned:
  https://x.com/HuiLibaa/status/2084634775709716919
- One targeted developer-pilot invitation was posted in a relevant Circle
  developer-relations discussion:
  https://x.com/HuiLibaa/status/2084636152984932611
- A public correction was added below an older post that incorrectly described
  Base Mainnet charging as live. The verified state remains mainnet charging
  disabled and `/canary` fail-closed:
  https://x.com/HuiLibaa/status/2084636515540648348
- These actions are distribution evidence only. They are not external adoption,
  an official endorsement, a customer, a payment commitment, or revenue.

## Live x402 payment-loop verification on 2026-08-04

- A real Arc Testnet x402 v2 payment loop was executed and verified:
  `402 challenge -> EIP-712 signature -> Gateway settlement -> resource
  delivery -> durable ledger write -> explorer receipt`.
- Evidence file: `artifacts/verification/x402-payment-evidence-2026-08-04.json`
  (payer `0x25771353...6F`, amount 0.001 USDC, status 200, ledger recorded,
  explorer receipt `https://testnet.arcscan.app/tx/0397d3fb-...`).
- This is a project-party testnet payment loop, not external adoption,
  a customer, or revenue.
- CDP x402 Bazaar indexing still requires a controlled Base Sepolia
  CDP-facilitated settlement (needs CDP API credentials), which remains HOLD.


## Stop rules

- Do not activate real-fund mainnet paths for eligibility or publicity.
- Do not invent a legal entity, team biography, customer, revenue, integration,
  budget, or partnership.
- Do not accept third-party legal terms on behalf of the owner without explicit
  action-time approval for those exact terms.
- Do not mass-post identical promotion or treat social impressions as demand.
- After 20 qualified outreach attempts, if fewer than three independent
  integrations and no paid-pilot intent exist, keep feature build on HOLD and
  revise the buyer/problem hypothesis.

## Official references checked

- Circle Developer Grants: https://www.circle.com/grant
- Circle Alliance Program: https://www.circle.com/alliance-program
- Base funding pathways: https://docs.base.org/get-started/get-funded
- Ethereum Foundation ESP applicants: https://esp.ethereum.foundation/applicants
- Gitcoin Grants Program: https://gitcoin.co/program
- Optimism grants and Retro Funding: https://gov.optimism.io/c/grants/87
- Official MCP Registry publishing: https://modelcontextprotocol.io/registry/quickstart
- MCP Registry terms: https://modelcontextprotocol.io/registry/terms-of-service
- CDP x402 Bazaar: https://docs.cdp.coinbase.com/x402/bazaar
