# Security

LedgerGuard is an early testnet service. Do not use it to protect or move real
funds.

## Scope and guarantees

- The hosted service never needs a seed phrase or private key.
- Transaction signing belongs in the caller's wallet.
- Arc Mainnet is fail-closed and cannot be enabled by a single environment
  variable.
- The public rate limiter is best-effort and is not a global abuse-control
  system.
- `ALLOW` requires a successful read-only simulation and a declared payer for
  supported transfer or approval intents.
- Unknown contract calls and native USDC payments to contract recipients remain
  `REVIEW`; LedgerGuard does not claim to understand arbitrary contract effects.
- Evidence is a deterministic summary, not a signature, immutable archive, or
  proof that no unlogged internal effect occurred.

## Threat model and non-goals

LedgerGuard checks supported transaction shapes against caller-supplied intent.
It does not establish that the caller's intent is honest, that a recipient is
trustworthy, or that an external RPC is correct. It does not replace wallet
confirmation, contract audits, sanctions screening, endpoint authentication,
enterprise approvals, or independent monitoring.

The current free deployment relies on public RPC and per-instance serverless
state. It can fail closed during provider outages, but it cannot offer a
production SLA, globally consistent quota, tenant isolation, or durable evidence
retention. Real-funds use remains out of scope until those controls and an
independent security review exist.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository. Do not open
a public issue containing an exploit, credential, private transaction, or
personal information.

Include the affected route or commit, impact, reproduction steps, and a
suggested remediation if available. Never send a seed phrase, private key, or
funded test account.

No bug bounty or payment is promised unless agreed in writing before work
begins.
