# Publish `@ledgerguard1/sdk` to npm

This guide publishes the standalone SDK from `packages/sdk/`. The monorepo root export (`ledgerguard/sdk`) stays private; npm consumers install `@ledgerguard1/sdk`.

## Prerequisites

1. **npm account** `ledgerguard` with access to the `@ledgerguard1` org (created on npmjs.com).
2. **2FA** enabled on npm (recommended for scoped packages).
3. Clean git tree for the release commit (optional but recommended).

## One-time setup

```bash
npm login
npm whoami
npm org ls ledgerguard1
```

Expected org owner: `ledgerguard`.

### Windows PowerShell note

If `npm` fails with *「禁止运行脚本」*, use **`npm.cmd`** instead:

```powershell
npm.cmd login --auth-type=web
npm.cmd whoami
npm.cmd run publish:sdk
```

Or from repo root: `scripts\npm-win.cmd login --auth-type=web`

### 2FA required to publish

npm rejects publish when account 2FA is disabled. Either:

1. Enable **2FA** at https://www.npmjs.com/settings/ledgerguard/two-factor-auth → run `npm.cmd login` again → `npm.cmd run publish:sdk`, **or**
2. Create a **Granular Access Token** (Publish, scope `@ledgerguard1`) → `$env:NPM_TOKEN="npm_..."` → `npm.cmd run publish:sdk`

## Pre-publish checks (run from repo root)

```bash
npm test
npm run build
npm run test:sdk-pack
```

`test:sdk-pack` runs `npm pack`, installs the `.tgz` into a temp project, and imports SDK exports. **Verified locally on 2026-07-31.**

## Publish

### Automated (from repo root)

```bash
npm login
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
npm view @ledgerguard1/sdk
npm install @ledgerguard1/sdk
node -e "import('@ledgerguard1/sdk').then(m => console.log(Object.keys(m)))"
```

## Version bumps

1. Edit `version` in `packages/sdk/package.json` (semver).
2. Commit: `Release @ledgerguard1/sdk v0.1.1`.
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
| `403 Forbidden` | You are not owner of `@ledgerguard1` scope |
| `404` on install before first publish | Normal — package does not exist yet |
| Empty `dist/` | Run `npm run build` in `packages/sdk` |

## Current status

- Package name: `@ledgerguard1/sdk@0.1.0`
- npm org: `@ledgerguard1` (owner: `ledgerguard`)
- npm registry: publish after `npm login` on this machine
- Local `npm pack` install: **passed** (`npm run test:sdk-pack`)
