# LedgerGuard Repository Instructions

LedgerGuard is a protocol-neutral, non-custodial transaction control project.
Arc and x402 are adapters and validation channels, not the product boundary.

Durable project decisions live in `C:\Users\lw223\Documents\Obsidian Vault\02-项目`.
The current strategy sources are:

- `LedgerGuard-完整整合方案-2026-08-03.md`
- `LedgerGuard-后续AI承接与战略审计-2026-08-04.md`
- `LedgerGuard-开放生态与长期治理方案-2026-08-04.md`

Safety boundaries:

- Non-custodial and read-only by default.
- Never store, log, request, or commit private keys, seed phrases, API secrets, or wallet credentials.
- Any new mainnet remains disabled until official parameters exist, conformance passes, and a human approves activation.
- Unknown network state, RPC disagreement, or failed simulation must fail closed.
- No contract deployment or real-fund transaction is authorized by ordinary code changes.
- AI may explain or propose policy, but may not sign or override a deterministic block.
- Use each asset's declared atomic unit; never infer decimals from a marketing label.

Before release, run `npm test`, `npm run typecheck`, `npm run build`,
`npm audit --omit=dev`, and the documented read-only production checks.

Never convert test assets, self-traffic, automation clicks, social impressions,
or a 402 challenge into claims of customers, revenue, settlement, or official recognition.
