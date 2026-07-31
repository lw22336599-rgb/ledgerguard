# Open source policy

LedgerGuard is an open repository (MIT) for **integration trust**. Production security
judgment runs on the **hosted API** at https://ledgerguard-gules.vercel.app. This document
states what we open, what we keep on the service, and how that may change.

## Principles

1. **Open “how to integrate”** — SDK, schemas, examples, adapter interfaces, Guard Link format.
2. **Protect “how we judge”** — preflight rules, scoring thresholds, threat data, hosted-only paths.
3. **Fail closed** — unknown networks, failed simulation when required, and ambiguous evidence never imply approval.
4. **Honest scope** — see `docs/MESSAGING_AND_CLAIMS.md`; no overclaim of uniqueness or paying customers.

## Layer matrix

| Layer | Contents | Open in repo? | Production use |
| --- | --- | --- | --- |
| ① Interface | OpenAPI, MCP, REST paths, `@ledgerguard1/sdk` | **Yes** | Call hosted API |
| ② Format | Guard Link URL, request/response JSON shapes | **Yes** | Parse & construct requests |
| ③ Adapter slot | `NetworkAdapter` type, `/v1/network-adapters` | **Yes** | Read enabled networks at runtime |
| ④ Examples | `examples/`, integration guides | **Yes** | Copy patterns |
| ⑤ Tests | Public regression tests | **Mostly yes** | CI only; bypass-focused cases may move private later |
| ⑥ Engine | `src/services/preflight.ts`, evidence rules, simulation policy | **Visible today** | **Use hosted API — do not rely on self-hosted forks for production** |
| ⑦ Data | Malicious address lists, phishing feeds (when added) | **No** | API-only oracle results |

### Why the engine is visible today

Early rules are deterministic and relatively small. As rules and data mature, we plan to:

- keep the public repo focused on SDK + specs + examples; and/or
- move rule-heavy paths to a private deployment while keeping HTTP contracts stable.

Integrators should treat **`POST /v1/preflight` / `/v1/can-sign` on the hosted service** as the
supported oracle — not a fork of `preflight.ts`.

## What you may do

- Install `@ledgerguard1/sdk` and call the public API (free tier limits apply).
- Parse Guard Links per `docs/GUARD_LINK_FORMAT.md`.
- Propose network adapters per `docs/NETWORK_ADAPTER_SPEC.md`.
- Submit integration evidence via GitHub issues for `/integrations` listing.

## What we discourage

- Self-hosting the engine to bypass metering or avoid API updates.
- Marketing a fork as “official LedgerGuard” without attribution.
- Claiming `ALLOW` guarantees safety, profit, or merchant identity.

## Forks and competition

MIT allows forks. Our moat is **operational oracle quality**, **hosted availability**,
**integration attribution**, and **future data layers** — not license lock-in. Competing
products should differentiate honestly (see public messaging guide).

## x402 compatibility

We map to the draft [Payment Preflight Record](https://github.com/x402-foundation/x402/pull/2792)
as a **compatible implementation** — we do not own the x402 specification. See
`docs/PREFLIGHT_RECORD_MAPPING.md`.

## Questions

- Integration: `docs/DEVELOPER_INTEGRATION_INVITE.md`
- Security reports: GitHub Issues (no secrets in public tickets)
- Contact: lw22336599@gmail.com

Last updated: 2026-07-31
