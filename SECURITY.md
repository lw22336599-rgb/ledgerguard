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

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository. Do not open
a public issue containing an exploit, credential, private transaction, or
personal information.

Include the affected route or commit, impact, reproduction steps, and a
suggested remediation if available. Never send a seed phrase, private key, or
funded test account.

No bug bounty or payment is promised unless agreed in writing before work
begins.
