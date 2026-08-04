# Arc Discord post — English

Post in #dev-help or ecosystem channel (adjust tone to channel rules).

---

Hi Arc builders — sharing a non-custodial USDC payment safety demo on **Arc Testnet**.

**LedgerGuard**

- **Guard Links** — create a payment request URL/QR; payer reviews amount, recipient, and purpose before signing in their wallet  
  https://ledgerguard-gules.vercel.app/guard/create  
- **npm SDK** — `@ledgerguard1/sdk` (preflight before sign, evidence after settlement)  
  https://www.npmjs.com/package/@ledgerguard1/sdk  
- **HTTP API** — `POST /v1/can-sign`, `/v1/preflight`, `/v1/evidence` · OpenAPI + MCP  

No custody · no private keys · honest preflight copy (not “verified merchant”).

Guard Links are **Arc Testnet only** (test assets). Base Mainnet x402 is a disabled-by-default canary code path; the public `/canary` route remains closed.

**Looking for:** 1 external team to integrate and file public evidence (request IDs + repo link):  
https://github.com/lw22336599-rgb/ledgerguard/issues/new?template=integration-test.yml

Repo: https://github.com/lw22336599-rgb/ledgerguard  
Home: https://ledgerguard-gules.vercel.app/
