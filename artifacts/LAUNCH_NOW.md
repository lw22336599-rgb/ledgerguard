# Launch now — promotion + Grant (≈45 minutes)

Do these in order. Code is done; this is **your** account work.

---

## Step 1 — Tweet (10 min)

1. Open folder: `artifacts/r1-promo/` (run `node scripts/capture-r1-promo.mjs` if PNGs missing)
2. Log in: https://x.com/HuiLibaa
3. Compose → paste text from `artifacts/r1-promo/tweet-draft.txt`
4. Attach **1–2 images** (pick `01-home-hero.png` + `03-guard-link-qr.png`)
5. Post

**Optional automation:** Chrome open + logged in → `CHROME_CDP_URL=http://127.0.0.1:9333 node scripts/post-x-guard-link-tweet.mjs` (needs promo images in `artifacts/guard-link-promo/`)

---

## Step 2 — Arc community (10 min)

1. Join Arc Discord (link from https://www.circle.com/grant → “Join the Arc Community”)
2. Find **#developers** or **#showcase** (or closest fit)
3. Paste `artifacts/community/arc-discord-post.txt`
4. Do **not** spam multiple channels same day

---

## Step 3 — Circle Grant (25 min)

1. Open **copy-paste pack:** `docs/GRANT_APPLICATION_COPYPASTE.md`
2. Fill only:
   - `[YOUR LEGAL NAME]`
   - `[YOUR BACKGROUND]`
   - `[YOUR AMOUNT]` (see milestone template inside doc)
3. Go to https://www.circle.com/grant → **Apply**
4. Paste sections from the doc into the form
5. Attach links: demo, GitHub, OpenAPI
6. Submit → save confirmation

---

## Step 4 — Track (ongoing)

When someone tries the demo, ask them to open a GitHub issue with:

- Integration name (public)
- `X-LedgerGuard-Request-Id` from API response
- What broke or confused them

That becomes your first **external validation** evidence.

---

## Do not

- Claim paying customers or 0.5% fees
- Say “Guard Link on Base Mainnet”
- Say Grant is approved before Circle confirms
