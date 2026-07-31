# Publish `@ledgerguard/sdk` to npm

This guide publishes the standalone SDK from `packages/sdk/`. The monorepo root export (`ledgerguard/sdk`) stays private; npm consumers install `@ledgerguard/sdk`.

## Prerequisites

1. **npm account** with access to the `@ledgerguard` scope.
   - First publish: create the org at https://www.npmjs.com/org/create (free) or use your personal scope and rename the package before publish.
2. **2FA** enabled on npm (recommended for scoped packages).
3. Clean git tree for the release commit (optional but recommended).

## One-time setup

```bash
npm login
npm whoami
```

If `@ledgerguard` org does not exist yet, either:

- Create `@ledgerguard` on npm and add your user as owner, **or**
- Change `name` in `packages/sdk/package.json` to your personal scope (e.g. `@youruser/ledgerguard-sdk`) before the first publish.

## Pre-publish checks (run from repo root)

```bash
npm test
npm run build
cd packages/sdk
npm run pack:check
```

`pack:check` lists tarball contents. Expect only:

- `package/dist/**`
- `package/README.md`
- `package/package.json`

### Test install from tarball (no registry)

From repo root:

```bash
npm run test:sdk-pack
```

This runs `npm pack`, installs the `.tgz` into a temp project, and imports `LedgerGuardClient`, `withPreflight`, and `preflightFetch`. **Verified locally on 2026-07-31.**

## Publish

### Automated (from repo root)

```bash
npm login
# Create org once: https://www.npmjs.com/org/create → name: ledgerguard
npm run publish:sdk:dry-run   # pack smoke + publish dry-run
npm run publish:sdk           # real publish
```

Or manually:

```bash
cd packages/sdk
npm publish --access public
```

`publishConfig.access` is already `"public"` in `package.json`. `prepublishOnly` runs typecheck + build automatically.

### Verify after publish

```bash
npm view @ledgerguard/sdk
npm install @ledgerguard/sdk
node -e "import('@ledgerguard/sdk').then(m => console.log(Object.keys(m)))"
```

## Version bumps

1. Edit `version` in `packages/sdk/package.json` (semver).
2. Commit: `Release @ledgerguard/sdk v0.1.1`.
3. Tag (optional): `git tag sdk-v0.1.1`.
4. Run publish steps above.

## CI publish (optional, later)

Use an npm **Granular Access Token** with publish scope, stored as `NPM_TOKEN`:

```yaml
- run: npm publish --access public
  working-directory: packages/sdk
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

| Error | Fix |
| --- | --- |
| `ENEEDAUTH` | Run `npm login` |
| `403 Forbidden` | You are not owner of `@ledgerguard` scope |
| `404` on install before first publish | Normal — package does not exist yet |
| Empty `dist/` | Run `npm run build` in `packages/sdk` |

## Current status

- Package name: `@ledgerguard/sdk@0.1.0`
- npm registry: **not published yet** — requires `npm login` + `@ledgerguard` org on this machine
- Local `npm pack` install: **passed** (`npm run test:sdk-pack`)
- Publish helper: `npm run publish:sdk` (runs pack smoke test first)
