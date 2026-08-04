# LedgerGuard Repository Instructions

LedgerGuard is a protocol-neutral, non-custodial transaction control project.
Arc and x402 are adapters and validation channels, not the product boundary.

Durable project decisions live in `C:\Users\lw223\Documents\Obsidian Vault\02-项目`.
The current strategy sources are:

- `LedgerGuard-完整整合方案-2026-08-03.md`
- `LedgerGuard-后续AI承接与战略审计-2026-08-04.md`
- `LedgerGuard-开放生态与长期治理方案-2026-08-04.md`
- `LedgerGuard-全量产品市场审计-2026-08-04.md`
- `LedgerGuard-开放生态与多链平台总规划-2026-08-04.md`

Development governance:

- `docs/BATCH_DEVELOPMENT_MASTER_PLAN.md` is the locked scope and acceptance
  source for the next platform-refactor batch.
- Start every material release by completing
  `docs/DEVELOPMENT_BATCH_TEMPLATE.md` before changing implementation code.
- Work on one release branch with recoverable local checkpoints. Do not
  repeatedly publish or deploy incomplete slices. Merge, publish, and deploy
  once only after the full local acceptance gate passes.
- A new idea is not implementation scope until buyer, pain, substitute,
  acceptance test, failure mode, evidence gate, compatibility impact, and
  rollback are recorded.
- Do not hide uncertain or unfinished work in a large batch. Any scope change
  must be recorded and re-reviewed before implementation continues.

Safety boundaries:

- Non-custodial and read-only by default.
- Never store, log, request, or commit private keys, seed phrases, API secrets, or wallet credentials.
- Any new mainnet remains disabled until official parameters exist, conformance passes, and a human approves activation.
- Unknown network state, RPC disagreement, or failed simulation must fail closed.
- No contract deployment or real-fund transaction is authorized by ordinary code changes.
- AI may explain or propose policy, but may not sign or override a deterministic block.
- Use each asset's declared atomic unit; never infer decimals from a marketing label.

Before release, run `npm test`, `npm run typecheck`, `npm run build`,
`npm audit --omit=dev`, `npm run audit:ui:local`, and the documented
read-only production checks. After deployment, run
`npm run audit:ui:production`. A release is not complete until the real
production UI has passed form submission, invalid-input, stale-state,
desktop/mobile, status-consistency, and route checks in `docs/RELEASE_ACCEPTANCE.md`.

Never convert test assets, self-traffic, automation clicks, social impressions,
or a 402 challenge into claims of customers, revenue, settlement, or official recognition.
