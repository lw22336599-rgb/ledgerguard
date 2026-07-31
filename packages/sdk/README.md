# @ledgerguard/sdk

Non-custodial stablecoin payment safety for Arc and supported EVM networks.

## Install

```bash
npm install @ledgerguard/sdk
```

## Quick start

```js
import { LedgerGuardClient } from "@ledgerguard/sdk";

const client = new LedgerGuardClient({
  baseUrl: "https://ledgerguard-gules.vercel.app",
});

const decision = await client.canSign({
  network: "arcTestnet",
  to: "0x3600000000000000000000000000000000000000",
  data: "0x…",
  recipient: "0x2222…2222",
  amountMicroUsdc: "1000000",
  purpose: "Invoice #42",
});

if (decision.decision !== "ALLOW") {
  throw new Error("Blocked by LedgerGuard");
}
// ask the wallet to sign only after this point
```

## withPreflight guard

```js
import { withPreflight } from "@ledgerguard/sdk";

await withPreflight(
  {
    buildInput: () => ({
      network: "arcTestnet",
      to: usdc,
      data: transferCalldata,
      recipient,
      amountMicroUsdc: "1000000",
      purpose: "Guarded transfer",
    }),
    useCanSign: true,
  },
  async () => wallet.sendTransaction({ to: usdc, data: transferCalldata }),
);
```

See `docs/INTEGRATION_STACK.md` in the main repository for the recommended stack with x402 sellers and Arc Guard Links.
