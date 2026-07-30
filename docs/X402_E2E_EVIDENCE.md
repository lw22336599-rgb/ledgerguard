# Circle Gateway x402 end-to-end evidence

Status: **PASS (Arc Testnet only)**

Verified at: `2026-07-29T12:09:16.395Z`

This record proves one controlled technical payment loop using valueless testnet
USDC. It does not prove production readiness, customer demand, or revenue.

## Verified flow

1. Circle's official faucet funded a disposable buyer on Arc Testnet.
2. The buyer approved and deposited `0.01` test USDC into Circle Gateway.
3. LedgerGuard returned an HTTP 402 challenge for its paid resource.
4. The buyer checked the challenge against hard-coded safety expectations before
   creating the EIP-712 payment authorization.
5. Circle Gateway accepted the authorization and settled `0.001` test USDC.
6. LedgerGuard returned HTTP 200 and the paid resource.
7. The buyer's available Gateway balance changed from `0.010` to `0.009`.

## Public identifiers

- Paid resource:
  `https://ledgerguard-gules.vercel.app/v1/paid/network-risk`
- Network: Arc Testnet, `eip155:5042002`
- Test USDC: `0x3600000000000000000000000000000000000000`
- Recipient: `0xf1437d9cd304ae49f2ec005ac967813b3a7c466c`
- Disposable payer: `0x257713534b81f053200c94ecEFDc0aAfa92dF68F`
- Faucet transaction:
  `0x3790ec1ae2a8d1dc31dc2ba7dcaf0dbdcb8f0bbd3abe607cf37237230c5557d2`
- Gateway approval transaction:
  `0x0b5d0cf9b7ffc5074f6a56079ef136e530f113867fa275869d9fb76bb4d8215f`
- Gateway deposit transaction:
  `0xe75696e0f9594b8c3c3d2052515a70cbb753e4a22c81b3999c11458e3680ea29`
- Circle settlement identifier:
  `f7f86aa8-729d-4bc0-80ba-a983cb3ce425`

## Safety boundaries

- The disposable buyer private key is stored only in the git-ignored local file
  `.env.x402-buyer.local`.
- The buyer refuses any challenge whose network, asset, amount, recipient, or
  Circle Gateway verifying contract differs from the expected values.
- The helper permits only a `0.01` test USDC deposit and a `0.001` test USDC
  payment.
- Arc Mainnet remains disabled and requires the separate mainnet release gate.

## Durable-ledger follow-up

Verified at: `2026-07-30T06:42:31.109Z`

After production developer self-service and Upstash Redis were enabled, the
controlled buyer completed another `0.001` test USDC payment. The paid resource
returned HTTP 200 and `ledgerStatus: recorded`, proving that the settlement was
also written to the durable payment ledger.

- Circle settlement identifier:
  `0e2cef30-2e15-458e-945b-c179f9dd595a`
- Gateway available balance: `0.008` test USDC before, `0.007` after
- Recipient:
  `0xf1437d9cd304ae49f2ec005ac967813b3a7c466c`

This remains testnet technical evidence only. It is not revenue and does not
prove an external customer.
