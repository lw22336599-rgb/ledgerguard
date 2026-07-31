# Next steps (English checklist)

Last updated: 2026-07-31

## Phase A — Remediation package (repository)

- [x] P0+P1 product scope shipped and deployed  
- [x] `@ledgerguard1/sdk@0.1.1` code ready on main (hosted-API client; see OPEN_SOURCE_POLICY) — **npm publish pending 2FA**  
- [x] **150** automated tests passing  
- [x] `/integrations`, `/v1/can-sign`, webhooks, integration docs live  
- [x] `examples/quickstart.mjs` uses `@ledgerguard1/sdk`  
- [x] `docs/PREFLIGHT_RECORD_MAPPING.md` (x402 draft compatibility)  
- [x] `docs/NETWORK_ADAPTER_SPEC.md`  
- [x] `docs/GUARD_LINK_FORMAT.md`  
- [x] `docs/OPEN_SOURCE_POLICY.md`  
- [x] `docs/WALLET_EXCHANGE_INTEGRATION.md`  
- [x] Footer partners row (x402 / Arc / Base demo); homepage + `/docs` narrative  
- [x] `docs/MESSAGING_AND_CLAIMS.md` aligned to payment intent safety API  

## Phase B — You must do manually (security + traffic)

- [ ] Revoke exposed npm tokens; regenerate 2FA recovery codes — see `docs/SECURITY_CREDENTIAL_ROTATION.md`  
- [ ] Publish `@ledgerguard1/sdk@0.1.1` — `node scripts/publish-sdk.mjs` (needs npm 2FA OTP in browser, or granular `NPM_TOKEN`)  
- [ ] Submit Circle Grant — **Cohort 2 Open** — direct URL in `docs/QUESTBOOK_GRANT_URL.md` (wallet connect + onchain sign required)  
- [ ] Post outreach — copy from `docs/outreach/`  

## Phase C — Primary goal: first external integration

- [ ] Send `docs/DEVELOPER_INTEGRATION_INVITE.md` to 3–5 Arc / agent / x402 builders  
- [ ] Receive one GitHub issue via **Independent integration evidence** template  
- [ ] Update public claim from 0 → 1 verified integration (after issue review)  

## Optional engineering

- [ ] Enable Base preflight on Vercel: `BASE_PREFLIGHT_ENABLED=true` (API only)  
- [ ] Review GitHub Dependabot alerts (2 open on default branch)  
- [ ] Bump SDK to `0.1.1` when API changes ship  

## Explicitly not now

- Domain purchase  
- Billing / cashier  
- Guard Link multi-chain  
- Claims of paying customers, 0.5% platform fee, or “verified merchant” badges  
- Private “LedgerGuard standard” parallel to x402 PR #2792  

## Reference links

| Resource | URL |
| --- | --- |
| Demo | https://ledgerguard-gules.vercel.app |
| Developer keys | https://ledgerguard-gules.vercel.app/developer |
| npm SDK | https://www.npmjs.com/package/@ledgerguard1/sdk |
| Integration issue | https://github.com/lw22336599-rgb/ledgerguard/issues/new?template=integration-test.yml |
| Grant copy-paste | `docs/GRANT_APPLICATION_COPYPASTE.md` |
| x402 draft mapping | `docs/PREFLIGHT_RECORD_MAPPING.md` |
