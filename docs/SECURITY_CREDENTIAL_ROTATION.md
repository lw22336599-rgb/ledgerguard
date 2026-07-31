# npm and account credential rotation

If tokens, recovery codes, or OTP secrets were shared in chat or committed by mistake, rotate them immediately.

## npm access tokens

1. Open https://www.npmjs.com/settings/ledgerguard/tokens  
2. **Revoke** any exposed tokens  
3. Create a new **Granular Access Token**  
   - Permissions: **Read and write** (publish) for packages `@ledgerguard1/*`  
   - Prefer tokens tied to 2FA; do not paste tokens into chat or git  
4. Store locally only:

```powershell
[System.Environment]::SetEnvironmentVariable("NPM_TOKEN", "npm_...", "User")
```

5. Publish from repo root:

```powershell
npm.cmd run publish:sdk
```

## npm 2FA recovery codes

1. Open https://www.npmjs.com/settings/ledgerguard/two-factor-auth  
2. **Regenerate recovery codes** if they were exposed  
3. Save the new codes offline (password manager or paper); never share them  

Recovery codes are for **account recovery**, not for `npm publish`.

## CLI login (Windows)

PowerShell may block `npm.ps1`. Use:

```powershell
npm.cmd login --auth-type=web
npm.cmd whoami
```

Or: `scripts\npm-win.cmd login --auth-type=web`

## After rotation

- Confirm old tokens show as revoked on npmjs.com  
- Run `npm.cmd whoami` on each machine you use for publish  
- Do not commit `.npmrc` with auth tokens (already in `.gitignore` patterns for `.env`)
