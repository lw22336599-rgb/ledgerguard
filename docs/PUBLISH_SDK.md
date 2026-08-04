# Publish `@ledgerguard1/sdk` to npm

This guide publishes the standalone SDK from `packages/sdk/`. The monorepo root export (`ledgerguard/sdk`) stays private; npm consumers install `@ledgerguard1/sdk`.

## Current release state

- Public package: `@ledgerguard1/sdk@0.1.1`
- Public GitHub release: `sdk-v0.1.1`
- Clean-room installation: verified 2026-08-04
- Release method for `0.1.1`: manual token publication
- Required method for the next release: GitHub Actions OIDC Trusted Publishing

The manual token path is retained only as historical evidence. Do not publish a
new version with a long-lived token.

## Prerequisites

1. **npm account** `ledgerguard` with access to the `@ledgerguard1` org (created on npmjs.com).
2. **2FA** enabled on npm (recommended for scoped packages).
3. Clean git tree for the release commit (optional but recommended).

## One-time Trusted Publishing setup

1. Open the npm package settings for `@ledgerguard1/sdk`.
2. Add a GitHub Actions trusted publisher with these exact values:

   - organization or user: `lw22336599-rgb`
   - repository: `ledgerguard`
   - workflow filename: `publish-sdk.yml`
   - environment: `npm-production`
   - allowed action: `npm publish`

3. Create the GitHub environment `npm-production` and require an approval before
   deployment when the account plan supports it.
4. After one OIDC release succeeds, set package publishing access to require 2FA
   and disallow tokens, then revoke obsolete automation tokens.

The workflow uses a GitHub-hosted runner, Node 24, a current npm CLI,
`id-token: write`, a version equality check, full release verification, and no
long-lived npm secret.

## Legacy manual setup (do not use for a new release)

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

### Legacy 2FA and token publishing

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

## Publish the next version

1. Bump `packages/sdk/package.json` to a new patch version.
2. Run `npm run verify:release` locally.
3. Merge the reviewed change into `main`.
4. In GitHub Actions, run **Publish SDK** and enter the exact package version.
5. Approve the `npm-production` environment deployment.
6. Verify the npm version, provenance, clean installation, release notes, and
   repository status before announcing it.

The workflow refuses to publish when the requested version differs from
`package.json` or already exists in the npm registry.

### Legacy automated command (historical only)

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
2. Commit: `Release @ledgerguard1/sdk v<version>`.
3. Tag (optional): `git tag sdk-v<version>`.
4. Run publish steps above.

## CI publish

The authoritative workflow is `.github/workflows/publish-sdk.yml`. It uses npm
Trusted Publishing and must not receive `NPM_TOKEN`.

## Troubleshooting

| Error | Fix |
| --- | --- |
| `ENEEDAUTH` | Run `npm login` |
| `403 Forbidden` | You are not owner of `@ledgerguard1` scope |
| `404` on install before first publish | Normal — package does not exist yet |
| Empty `dist/` | Run `npm run build` in `packages/sdk` |

## Current gate

Version `0.1.1` is public and installable. On 2026-08-04 npm confirmed the
Trusted Publisher connection for `lw22336599-rgb/ledgerguard`, workflow
`publish-sdk.yml`, and environment `npm-production`; the repository workflow
matches those values. The next version remains **HOLD** until a meaningful SDK
change is ready. A successful `0.1.2` or later OIDC release is required before
claiming trusted publication or provenance; do not publish an empty version
only to test the channel.
