# LedgerGuard Repository Instructions

This repository belongs to the LedgerGuard / ArcOps project.

Durable project decisions live in:

- `C:\Users\lw223\Documents\Obsidian Vault\02-项目\ArcOps支付控制与财务运营平台.md`
- `C:\Users\lw223\Documents\Obsidian Vault\02-项目\LedgerGuard-AI支付网关市场核实-2026-07-29.md`

Safety boundaries:

- Non-custodial and read-only by default.
- Never store, log, request, or commit private keys, seed phrases, API secrets, or wallet credentials.
- Arc mainnet remains disabled until official parameters exist and a human approves activation.
- Unknown network state, RPC disagreement, or failed simulation must fail closed.
- No contract deployment or real-fund transaction is authorized by ordinary code changes.
- Use USDC's 6-decimal ERC-20 view for product amounts. Arc's 18-decimal native view is only for raw gas and `msg.value`; never double-count them.

Before release, run `npm test`, `npm run typecheck`, and a live read-only Arc Testnet health check.
