# Monitoring and automation

LedgerGuard uses layered, read-only monitoring. Automation never signs, transfers funds, enables mainnet, publishes social content, or changes customer state.

## Schedule

| Cadence | Automation | Evidence | Escalation |
|---|---|---|---|
| Every hour at minute 17 | `Production smoke` | health, readiness, Arc Testnet, x402 challenge, disabled mainnet, registry/schema checks | any failed gate |
| Daily at 03:41 UTC | `Scheduled platform assurance` | full desktop/mobile interactions, internal links, extension conformance, dependency audit | any high UI issue, invalid registry, vulnerability, or fail-open state |
| Every code push/PR | `CI` | typecheck, coverage, conformance, build, local UI, clean package installs, rollback static checks, dependency audit | merge/deploy blocked |
| Manual release or incident | `Production UI acceptance` | retained browser evidence bundle | release/incident owner reviews |

The daily assurance job replaces the previous duplicate scheduled UI job. The UI workflow remains manually callable for releases and incidents.

## Alert rules

Notify the owner only when at least one of these is true:

- `/health` or `/ready` is not HTTP 200;
- Arc Testnet chain ID is not `5042002`;
- any real-fund/mainnet state unexpectedly becomes enabled;
- no active extension remains, registry parsing fails, or a manifest is close to expiry;
- a public route, enabled control, Guard Link flow, developer error path, or status aggregation fails;
- a production dependency vulnerability is reported;
- GitHub CI, smoke, or assurance fails;
- an official response, external integration/use signal, or approval-gated action appears.

Expired and revoked registry entries remain visible as audit history. They create warnings but do not make the whole registry unhealthy while at least one valid active entry remains.

## Incident and rollback

1. Preserve the request ID, failed path, workflow URL, UTC time, manifest/version, and deployment ID.
2. Keep real-fund gates disabled. Revoke an affected extension without deleting history.
3. Follow `docs/PLATFORM_KERNEL_ROLLBACK.md`; use an immutable Vercel rollback or a normal Git revert, never rewrite `main`.
4. Re-run release verification, production monitor, and interaction acceptance.
5. Close only when the same failed gate passes and the evidence bundle is retained.

Passing automation proves technical availability only. It is not evidence of external adoption, customer revenue, endorsement, or product-market fit.
