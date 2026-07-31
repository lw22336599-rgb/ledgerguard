# Next steps (English checklist)

Last updated: 2026-07-31

## Done

- [x] P0+P1 product scope shipped and deployed  
- [x] `@ledgerguard1/sdk@0.1.0` published on npm  
- [x] 148 automated tests passing  
- [x] `/integrations`, `/v1/can-sign`, webhooks, integration docs live  
- [x] `examples/quickstart.mjs` uses `@ledgerguard1/sdk`  

## You must do manually (security)

- [ ] Revoke exposed npm tokens; regenerate 2FA recovery codes — see `docs/SECURITY_CREDENTIAL_ROTATION.md`  
- [ ] Submit Circle Grant at https://www.circle.com/grant — paste from `docs/GRANT_APPLICATION_COPYPASTE.md`  
- [ ] Post outreach — copy from `docs/outreach/`  

## Primary goal: first external integration

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

## Reference links

| Resource | URL |
| --- | --- |
| Demo | https://ledgerguard-gules.vercel.app |
| Developer keys | https://ledgerguard-gules.vercel.app/developer |
| npm SDK | https://www.npmjs.com/package/@ledgerguard1/sdk |
| Integration issue | https://github.com/lw22336599-rgb/ledgerguard/issues/new?template=integration-test.yml |
| Grant copy-paste | `docs/GRANT_APPLICATION_COPYPASTE.md` |
