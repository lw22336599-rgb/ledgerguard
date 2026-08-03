# LedgerGuard Reference Integrations

Official, runnable examples that show how to integrate LedgerGuard into real
products. Each example is a complete, minimal implementation — copy, adapt,
deploy.

| # | Example | Directory | What it shows |
|:-:|---------|-----------|---------------|
| 1 | AI Agent (MCP) | `agent-mcp/` | An AI agent calls LedgerGuard before spending — the Agent-payment safety pattern. |
| 2 | E-commerce checkout | `ecommerce-checkout/` | Preflight a USDC payment during checkout, before the buyer signs. |
| 3 | Subscription billing | `subscription-billing/` | Recurring billing that checks the intent and reconciles evidence after settlement. |

## Why reference integrations matter

LedgerGuard is a hosted safety oracle: it answers "is this payment intent
safe to sign?" before signing and "did the settlement match the intent?"
after. The value is only realized when a product actually calls these two
checks. These examples prove the integration surface works end to end and
give developers a working starting point — no need to design the request
shapes themselves.

## Requirements

- Node.js >= 20
- A LedgerGuard endpoint (default: https://ledgerguard-gules.vercel.app)
- Optional API key from the Developer Console (`/developer`) for metered calls

## Run any example

```bash
cd <example-directory>
npm install            # or: npm ci
LEDGERGUARD_URL=https://ledgerguard-gules.vercel.app node index.mjs
```

Each example prints the preflight decision and, when a transaction hash is
provided, the evidence reconciliation result.

## Integration surface used

All examples use the `@ledgerguard1/sdk` package:

```ts
import { LedgerGuardClient } from "@ledgerguard1/sdk";

const guard = new LedgerGuardClient({ baseUrl: process.env.LEDGERGUARD_URL });

// Before the buyer signs:
const preflight = await guard.preflight({
  network: "arcTestnet",
  from: buyerAddress,
  to: usdcContract,
  data: transferCalldata,
  intent: { action: "transfer", expectedRecipient, expectedAmountMicroUsdc, purpose },
});

// After settlement:
const evidence = await guard.evidence({
  network: "arcTestnet",
  txHash,
  intent,
});
```

## Safety boundary

These examples only **check** — they never sign, hold keys, or move funds on
behalf of the user. The wallet remains in the buyer's hands. See the main
repo README for the full non-custodial boundary.
