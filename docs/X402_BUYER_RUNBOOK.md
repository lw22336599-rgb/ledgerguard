# Arc Testnet x402 buyer runbook

This runbook verifies discovery, payment challenge, buyer-side safety checks,
Circle Gateway settlement, paid resource delivery, and a public chain receipt.
It uses valueless Arc Testnet assets only.

## Safety boundary

- Never use a production wallet or real funds.
- Never paste a private key into the website, an issue, a log, or Git.
- The helper creates a disposable key in the git-ignored local file
  `.env.x402-buyer.local`.
- Treat that wallet as disposable even though the helper requests restrictive
  file permissions. Windows and copied files do not guarantee Unix-style
  `0600` protection.
- The helper refuses changes to the network, USDC address, price, seller
  address, or Circle verifying contract.
- Before any balance query, deposit, or payment, the helper verifies that the
  connected RPC reports Arc Testnet chain ID `5042002`.
- A wallet signature cannot be delegated to LedgerGuard or to a remote operator.

## Test sequence

From the repository root:

```powershell
npm.cmd install
npm.cmd run x402:buyer:init
npm.cmd run x402:buyer -- inspect
```

Fund the printed disposable address from Circle's official Arc Testnet faucet.
Then inspect balances and deposit the helper's fixed test amount:

```powershell
npm.cmd run x402:buyer -- status
npm.cmd run x402:buyer -- deposit 0.01
npm.cmd run x402:buyer -- pay
```

The final command must return HTTP 200, `paid: true`, a balance decrease of
`0.001` test USDC, and a `receipt` containing the Arc Testnet explorer URL.
Local evidence is written under `tmp/`, which is ignored by Git.

The public repository also contains a sanitized successful-run artifact under
`artifacts/verification/`. It proves a valueless testnet settle-deliver-ledger
flow only. It does not prove ownership of the configured seller address,
customer adoption, revenue, or mainnet readiness.

## Report the result

Open the [public test form](https://github.com/lw22336599-rgb/ledgerguard/issues/new/choose)
and include only:

- the public `X-LedgerGuard-Request-Id`;
- the public Arc Testnet transaction or settlement identifier;
- the observed result and expected result.

Do not include a private key, seed phrase, API token, or personal financial
information.
