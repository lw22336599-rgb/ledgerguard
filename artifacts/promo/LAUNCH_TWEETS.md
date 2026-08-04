# Launch Tweets (truthful draft — no fake claims)

Status: public preview. Every claim below is true and evidence-backed.
Do NOT add: revenue, users, customers, "global first", grant money, official endorsements.

## Tweet 1 — What it is (launch)
LedgerGuard is a protocol-neutral, non-custodial transaction intent control layer for stablecoin payments.

Before your wallet signs, it checks: who gets paid, how much, and why.

Review. Decide. Then sign — or don't.
https://ledgerguard-gules.vercel.app

## Tweet 2 — Why it matters (agents)
AI agents are about to move real money.

An agent that asks to pay needs a safety check before the wallet signs — not after.

LedgerGuard preflights every transfer: recipient, amount, intent.
https://github.com/lw22336599-rgb/ledgerguard

## Tweet 3 — What exists (evidence)
- Public demo: https://ledgerguard-gules.vercel.app
- 15-scene integration library (agents, checkout, subscriptions, tips, metering, NFTs, payroll)
- USDC + USDT (USDbC) support on Base
- 178 tests green
- x402 challenge enabled on Base mainnet (bounded canary, not a revenue claim)
https://github.com/lw22336599-rgb/ledgerguard

## Tweet 4 — How it works (preflight)
One preflight call in front of every transfer:
1. Declare intent: pay X, this much, for this reason
2. Engine decodes the real calldata
3. Checks: recipient safety, zero-address, seed list, amount match, intent match
4. Returns ALLOW / REVIEW / BLOCK before anything signs

Fail-closed by default. No private keys, no custody.
