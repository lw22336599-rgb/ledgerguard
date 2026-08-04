# LedgerGuard extension registry

`extensions/` contains public, versioned manifests. Registry inclusion proves only that a pinned manifest passed the published contract checks at review time. It is not an endorsement, security guarantee, partnership, or revenue promise.

Expired and revoked entries remain visible for auditability. Emergency revocations are appended to `revocations.json`; the original manifest is never deleted. Production readiness fails closed if the registry cannot be parsed. See `docs/EXTENSION_AUTHORING.md`.
