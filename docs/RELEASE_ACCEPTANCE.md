# Release acceptance

LedgerGuard uses evidence-based release gates. A passing build or a page that
renders is not an accepted release.

## Mandatory pre-deploy gates

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. `npm audit --omit=dev`
5. `npm run audit:ui:local`

The UI audit must cover every public route on desktop and mobile and must
exercise real interactions, not screenshots alone:

- required and malformed values produce a visible, specific response;
- a valid Guard Link can be created and opened;
- editing an intent invalidates the previously generated link and QR code;
- payment and receipt lookup failures never fail silently;
- developer API-key failures are explained;
- aggregate status never says operational while an enabled component is
  degraded;
- navigation, external links, legal pages, English copy, metadata, security
  headers, and CSP remain valid.

## Mandatory post-deploy gates

1. `npm run audit:ui:production`
2. Read-only production smoke tests for health, readiness, networks, disabled
   mainnet, and x402 challenges.
3. Repeat the critical Guard Link create, edit, pay, receipt, developer-key,
   status, and About interactions against the stable production URL.
4. Record external browser or wallet warnings separately. They are release or
   distribution blockers even when the application itself passes.

## Claim gate

Do not call a release complete, production-ready, commercially validated, or
externally adopted without the corresponding evidence. Tests, CI traffic,
project-party traffic, test tokens, stars, and forks are not customers or
revenue.
