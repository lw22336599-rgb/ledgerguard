# Extension authoring

LedgerGuard's core remains protocol-neutral. Community code integrates through a versioned remote contract instead of executing in the production process.

## Contract

1. Host an HTTPS `POST` endpoint outside LedgerGuard.
2. Create an Extension Manifest v1 with a full source commit, SHA-256 artifact digest, CAIP identifiers, expiry, permissions, limits, support URL, and limitations.
3. Validate it with `npm run conformance:extensions -- path/to/manifest.json`.
4. Open a pull request adding the manifest under `registry/extensions/`.
5. Registry review checks contract compatibility and evidence. It does not make the extension trusted, safe, or production-ready.

The adapter receives only the data declared in `runtime.permissions.data`. LedgerGuard enforces a deadline and response-size limit. Transport failure, invalid JSON, request-ID mismatch, expiry, or revocation fails closed. Extensions cannot access LedgerGuard signing material because LedgerGuard has none.

## Maturity labels

- `community`: submitted; no LedgerGuard test claim.
- `self-tested`: author or repository tests exist.
- `conformant`: public conformance suite passes for the pinned artifact.
- `production-candidate`: separate operational and security review completed; never means risk-free.

## Revenue boundary

Authors may host free or paid adapters. LedgerGuard does not promise demand, revenue, endorsement, or automatic distribution. Fees, support, privacy, and compliance remain the author's responsibility.
