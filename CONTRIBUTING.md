# Contributing

LedgerGuard accepts small, testable improvements to its protocol-neutral control
core, network and payment adapters, user surfaces, and verification tooling.

1. Use Node.js 24.x.
2. Copy `.env.example` to `.env` and use testnet values only.
3. Add or update a failing test before changing safety-sensitive behavior.
4. Run `npm install`, `npm run typecheck`, `npm run test:coverage`,
   `npm run build`, and `npm audit --omit=dev`.
5. Keep protocol-specific behavior in a thin adapter around the canonical control
   envelope; do not fork policy semantics for each chain or protocol.
6. Explain the safety property, user outcome, and public claim changed by the
   contribution.

Never commit private keys, seed phrases, API credentials, funded-wallet
material, or personally identifying payment data. Do not add guessed Arc
Mainnet parameters or weaken the mainnet fingerprint and approval gates.

Do not describe a 402 challenge as a settlement, a testnet transfer as revenue,
project-party traffic as external adoption, or a form click as a verified
submission. See `docs/GOVERNANCE.md` and `docs/PROJECT_STATUS.md` before opening
a pull request.
