# LedgerGuard Adapter Kit

TypeScript contracts for externally hosted, protocol-neutral LedgerGuard extensions.

Extensions never run inside the LedgerGuard production process, never receive private keys, and never sign. A manifest must be validated against `/schemas/extension-manifest-v1.json`; conformance is evidence of contract compatibility, not a security endorsement.

```ts
import { defineExtension, type AdapterRequest, type AdapterResponse } from "@ledgerguard1/adapter-kit";
```

See `docs/EXTENSION_AUTHORING.md` and the reference adapter in `examples/extensions/reference-policy-http`.
