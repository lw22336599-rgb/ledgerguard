# Full launch ops — tweet, npm publish, Questbook grant, Arc community
Set-Location $PSScriptRoot\..

Write-Host "=== LedgerGuard full launch ops ==="

if (Get-Process chrome -ErrorAction SilentlyContinue) {
  Write-Host "Closing Chrome to enable CDP on your @HuiLibaa profile..."
  taskkill /IM chrome.exe /F | Out-Null
  Start-Sleep -Seconds 3
}

Write-Host "[1/5] Starting Chrome with CDP (port 9222)..."
powershell -ExecutionPolicy Bypass -File scripts/start-chrome-debug.ps1
Start-Sleep -Seconds 4

Write-Host "[2/5] Publishing npm SDK (OTP via browser if needed)..."
node scripts/publish-sdk-otp.mjs
$npmOk = $LASTEXITCODE -eq 0
if (-not $npmOk) { Write-Host "npm publish pending OTP — continuing other steps..." }

Write-Host "[3/5] Posting X tweet..."
node scripts/post-r1-tweet.mjs
if ($LASTEXITCODE -ne 0) {
  Write-Host "Tweet step issue — see artifacts/r1-promo/post-result.json"
}

Write-Host "[4/5] Submitting Questbook grant..."
node scripts/submit-questbook-grant.mjs

Write-Host "[5/5] Arc community + grant tabs..."
node scripts/launch-grant-community.mjs

Write-Host ""
Write-Host "Results:"
Write-Host "  artifacts/r1-promo/npm-publish-result.json"
Write-Host "  artifacts/r1-promo/post-result.json"
Write-Host "  artifacts/r1-promo/grant-submit-result.json"
Write-Host "  artifacts/r1-promo/launch-ops-result.json"
