# Five-minute integration invite (English)

Copy this message to recruit your **first externally verified integration**.

---

## Short invite (DM / email / Discord)

Subject: **Try LedgerGuard preflight on Arc Testnet (5 min, free, no custody)**

Hi — I'm building **LedgerGuard**, a non-custodial USDC payment safety API on **Arc Testnet**.

Would you try a **5-minute integration** and share public evidence? Testnet only; no financial value.

**Install:**

```bash
npm install @ledgerguard1/sdk
```

**Minimal check:**

```bash
export LEDGERGUARD_API_KEY=lg_test_...   # create at https://ledgerguard-gules.vercel.app/developer
export LEDGERGUARD_INTEGRATION=your-project-testnet
node examples/quickstart.mjs             # or use client.preflight() / client.canSign()
```

**What we need back (no secrets):**

1. Your public project name or repo URL  
2. Your `X-LedgerGuard-Integration` value  
3. One or more `X-LedgerGuard-Request-Id` values from responses  
4. Optional: public testnet transaction hash after a Guard Link payment  

**Submit evidence:**  
https://github.com/lw22336599-rgb/ledgerguard/issues/new?template=integration-test.yml

**Docs:** https://ledgerguard-gules.vercel.app/docs  
**Integration stack:** https://ledgerguard-gules.vercel.app/docs/integration-stack  
**npm:** https://www.npmjs.com/package/@ledgerguard1/sdk  

LedgerGuard never holds keys. It compares declared payment intent to unsigned calldata before signing.

Thanks!

---

## Who to target

- Agent / wallet teams on Arc or USDC  
- x402 seller demos  
- Merchant tools adding “review before sign”  
- Circle / Arc ecosystem builders  

---

## What counts as verified

See `docs/EXTERNAL_VALIDATION.md`. Owner self-tests do **not** count. We need a **public third-party identity** plus reproducible request IDs or code.

Current verified count: **0** (honest public claim until issues are filed).
