# Security Review & Fix Report

No SAST or AI-reviewer report existed in the workspace, so this was a direct
source review of every file in the repository: the API (`server/`), the
storefront (`src/`), the GitHub-only admin console (`console/`), and the
deployment configuration (`.github/workflows/`, `render.yaml`).

Findings were confirmed by reading each code path end to end. All fixes below
have been applied and verified.

## Findings and fixes

| # | Issue | CWE | Severity | File | Status |
|---|-------|-----|----------|------|--------|
| 1 | Unauthenticated writes bypassed CSRF entirely — `verifyCsrf` returned `true` for every session-less request | CWE-352 | Critical | `server/security.js` | ✅ Fixed |
| 2 | Authenticated CSRF token compared with `===` (non-constant-time) | CWE-208 | Medium | `server/security.js` | ✅ Fixed |
| 3 | `X-Forwarded-For` trusted unconditionally — a client could rotate the header and defeat every per-IP rate limit | CWE-290 | High | `server/security.js`, `server/config.js` | ✅ Fixed |
| 4 | `parseCookies` threw `URIError` on a malformed percent-escape (request-level 500); pairs without `=` produced bogus keys; duplicates could shadow the session cookie | CWE-248 | Medium | `server/security.js` | ✅ Fixed |
| 5 | Guest order lookup accepted a blank email, compared non-constant-time, and `user_id = NULL` matched a `NULL` session id | CWE-639 (BOLA) | Critical | `server/routes/orders.js` | ✅ Fixed |
| 6 | Order IDs derived from `Date.now()` — ~6 base36 characters of clock entropy, enumerable | CWE-340 | High | `server/routes/orders.js` | ✅ Fixed |
| 7 | Support thread read/reply ownership used loose `===` on an attacker-supplied email and the same `NULL`-match flaw | CWE-639 (BOLA) | High | `server/routes/support.js` | ✅ Fixed |
| 8 | Support reply endpoint had no rate limit — unbounded message insertion and thread-ID probing | CWE-770 | Medium | `server/routes/support.js` | ✅ Fixed |
| 9 | `/api/auth/code/verify` had no per-IP limit and the attempt counter was incremented only *after* a failed compare, so a disconnect mid-request allowed unlimited retries | CWE-307 | High | `server/routes/auth.js` | ✅ Fixed |
| 10 | Login code hash compared with `!==` (non-constant-time) | CWE-208 | Medium | `server/routes/auth.js` | ✅ Fixed |
| 11 | `/api/auth/password` had no throttle on current-password verification | CWE-307 | Medium | `server/routes/auth.js` | ✅ Fixed |
| 12 | Unsafe production config only warned — the server would boot with the default bootstrap password, insecure cookies or LAN origins enabled | CWE-1188 | High | `server/config.js` | ✅ Fixed |
| 13 | Mock gateway authorises any Luhn-valid card and was reachable via silent fallback | payment bypass | Critical | `server/payments/mockGateway.js`, `server/payments/index.js` | ✅ Fixed |
| 14 | Checkout accepted an unbounded `items[]` array — one request forces thousands of DB lookups | CWE-770 | Medium | `server/routes/orders.js` | ✅ Fixed |
| 15 | No `Content-Security-Policy` on API responses | CWE-1021 | Low | `server/security.js` | ✅ Fixed |
| 16 | UPI demo used `demo@upi`, a syntactically valid VPA that may belong to a real person — users could send money to a stranger | CWE-1188 | High | `src/utils/upi.js` | ✅ Fixed |
| 17 | UPI deep link built from store-controlled `storeName` with no sanitisation or amount ceiling | CWE-20 | Medium | `src/utils/upi.js` | ✅ Fixed |
| 18 | `window.location.assign()` navigated the storefront itself to a `tez://` scheme; `buildGooglePayDemoUrl` could throw inside the click handler and blank the page | CWE-601 / CWE-248 | Medium | `src/pages/Checkout.jsx` | ✅ Fixed |

## Fix detail

**CSRF (1, 2).** Session-less writes now require an allowlisted `Origin`. When
`Origin` is absent, `Sec-Fetch-Site` must be `same-origin` or `none` — browsers
always send it, so a cross-site forged write is rejected while non-browser
clients (curl, mobile apps) still work. The authenticated path uses
`timingSafeEqual`.

**Proxy spoofing (3).** `clientIp()` only reads `X-Forwarded-For` when the new
`TRUST_PROXY` env flag is set. Enable it on Render (which does front the app
with a proxy); leave it off anywhere the API is directly exposed.

**Authorization (5, 7).** Order and support access now route through single
helpers (`canAccessOrder`, `canAccessThread`) that require a non-empty claimed
email, compare with `timingSafeEqual`, and only treat `user_id` as a match when
it is actually set.

**Order ID entropy (6).** `newOrderId()` uses `randomBytes(9)` base64url —
72 bits — so an order can no longer be enumerated by guessing the timestamp.

**Production safety (12).** `assertProductionSafety()` now exits non-zero
instead of warning, and additionally requires `ADMIN_EMAILS`, `STORE_ORIGINS`
and `ADMIN_ORIGINS` to be set.

**Payment bypass (13).** `MockGateway.confirm()` throws `503` when
`NODE_ENV=production`, so even if the registry falls back to mock no order can
be marked paid without a real gateway. (Note: `/api/checkout/*` already returns
410 in this branch, so this is defence in depth for when checkout is re-enabled.)

**UPI demo (16, 17, 18).** The placeholder is now `demo@invalid-upi` — the
handle contains a character UPI does not permit, so a payment app refuses it
rather than silently routing to whoever owns `demo@upi`. A real payee can be
set with `VITE_UPI_PAYEE_VPA` and is validated against the VPA grammar. Payee
name and note are stripped of control characters and length-capped, the amount
is capped at ₹10,00,000, and `URLSearchParams` percent-encodes everything so
store-controlled text cannot inject extra UPI parameters such as
`&pa=attacker@bank`. The link now opens via an anchor with
`rel="noopener noreferrer"` instead of navigating the storefront, and build
errors surface as a toast.

## Reviewed and found safe (no change needed)

- All SQL uses prepared statements with bound parameters — no injection paths.
- Passwords use scrypt (N=16384) with per-user salt and constant-time verify.
- Upload handling validates by magic bytes, writes a generated filename, serves
  only DB-registered files, and re-checks the resolved path against the upload
  root — no path traversal.
- Admin routes are gated by `requireRole`, which re-reads the email allowlist on
  every request, so revocation is immediate.
- Cart totals are recomputed server-side; client-supplied prices are ignored.
- No `dangerouslySetInnerHTML`, `eval`, `new Function` or `innerHTML` anywhere
  in the storefront or console.
- `console/GitHubOnlyAdmin.jsx` holds no GitHub token and makes no authenticated
  API calls — it reads `store-data.json` and exports a file for manual upload.
- `ctaTo` values from store data flow into react-router `<Link to>`, which does
  not execute `javascript:` URLs.
- `deploy-pages.yml` uses pinned major action versions and minimal
  `contents: read` permissions; `render.yaml` marks `ADMIN_EMAILS` and
  `BOOTSTRAP_PASSWORD` as `sync: false`.
- No secrets, tokens or API keys committed anywhere in the repository.

## Verification

- `node --check` passes on all nine modified JS files.
- `npm run build` and `npm run build:console` both succeed.
- API boots cleanly; `/api/health` returns 200.
- Malformed cookie header returns 200 instead of 500.
- Cross-site POST with no `Origin` but `Sec-Fetch-Site: cross-site` → 403.
- CSP header present on API responses.

## Action required before deploying

1. Set `TRUST_PROXY=true` in `render.yaml` (Render terminates TLS at a proxy, so
   without this every client shares one rate-limit bucket).
2. Confirm `ADMIN_EMAILS` and `BOOTSTRAP_PASSWORD` are set in the Render
   dashboard — the API now refuses to start in production without them.
3. If the UPI demo should reach a real account, set `VITE_UPI_PAYEE_VPA`;
   otherwise leave it unset and the link stays non-routable.
