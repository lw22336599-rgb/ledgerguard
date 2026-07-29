# Contributing

LedgerGuard accepts small, testable improvements to its Arc transaction
preflight, evidence, and x402 discovery surfaces.

1. Use Node.js 22.6 or newer.
2. Copy `.env.example` to `.env` and use testnet values only.
3. Run `npm install`, `npm test`, `npm run typecheck`, and `npm run build`.
4. Explain the safety property or user outcome changed by the contribution.

Never commit private keys, seed phrases, API credentials, funded-wallet
material, or personally identifying payment data. Do not add guessed Arc
Mainnet parameters or weaken the mainnet fingerprint and approval gates.
