# LedgerGuard public post drafts

These are drafts only. Publishing requires explicit action-time approval.

## Product preview

LedgerGuard is a non-custodial transaction intent control layer for users, apps,
and AI agents.

Before signing: verify recipient, amount, asset, network, and policy.
After settlement: reconcile what actually happened.

Arc Testnet public preview. Arc Mainnet remains disabled.
https://ledgerguard-gules.vercel.app

#Stablecoins #AIAgents #Payments #Web3Security

## Developer preview

LedgerGuard now has a protocol-neutral control envelope plus HTTP, SDK, MCP, and
x402 adapter surfaces. Protocols are adapters; deterministic policy remains the
authority.

We are looking for external developers to independently integrate the preview
and report what breaks.
https://github.com/lw22336599-rgb/ledgerguard

## Evidence update

LedgerGuard's strict evidence path detected an extra transfer in a real Arc
Testnet transaction and returned MISMATCH. That is the intended behavior: a
matching USDC event alone is not enough to call a payment verified.

Testnet activity is not revenue. The next milestone is one independently
reproducible external integration, not a larger claim.
