# Clothing ecommerce platform

A responsive React storefront for pants, trousers, 3/4 pants and track pants, with a separate administrator console and a secured Node.js API.

## What is included

- Product browsing, search, categories, sizing, cart and wishlist.
- Purchase enquiry checkout: customers review and send a pre-filled WhatsApp draft to an enabled store contact. No payment is taken by this website.
- A separate wholesale enquiry form and configurable quantity-based discount.
- Password-protected administrator console at `/console/` to manage products, sizes and stock, promotions, wholesale discount, announcements, hero/banner content, legal seller details, and multiple WhatsApp numbers.
- Product, hero and banner photos are selected with file uploads. The API checks image file signatures and size; the admin UI does not accept image URLs.
- Server-side admin access allowlist, session cookies, CSRF checks, rate limits, audit events and image validation.
- Privacy notice and terms page templates. The seller must complete accurate contact disclosures and review them for the live business before launch.

The app does not make the store compliant with every law by itself. Indian requirements depend on the seller, products, sales model and actual data practices. Have the final terms, privacy notice, tax treatment, product pricing and grievance disclosures reviewed by a qualified professional before accepting enquiries.

## Run locally

Use Node.js 22 or later. SQLite is provided by Node's built-in `node:sqlite` module.

1. Install Node.js 22 and npm.
2. From the project directory, install the frontend dependencies:

   ```sh
   npm ci
   ```

3. Copy `.env.example` to `.env`. Set an administrator email and a unique bootstrap password before starting the API.
4. Open three terminals in the project directory:

   ```sh
   npm run dev:api
   ```

   ```sh
   npm run dev
   ```

   ```sh
   npm run dev:console
   ```

5. Visit the storefront at `http://localhost:5173/`. The standalone development admin is at `http://localhost:5174/`.

The seeded administrator can sign in using the allowlisted email and `BOOTSTRAP_PASSWORD` from `.env`. Change the bootstrap password and keep `.env` private. The API initializes its SQLite database and uploaded-photo directory on first start.

## Deploy the storefront and admin UI to GitHub Pages

The repository includes [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml). It builds the storefront and admin console and deploys both as static files on every push to `main`.

1. Push the project files to the `main` branch of `logeshgp/clothing-ecommerce-platform`.
2. Deploy the API separately first (instructions below) and note its HTTPS origin, such as `https://your-api.example.com`. Do not include `/api` at the end.
3. In GitHub, open **Settings → Secrets and variables → Actions → Variables → New repository variable**.
4. Create the variable `VITE_API_URL` with the API HTTPS origin. It is a public endpoint, not a secret.
5. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
6. Open **Actions**, run **Deploy storefront and admin to GitHub Pages** (or push another commit), and wait for the Pages deployment to finish.
7. The storefront will be available at `https://logeshgp.github.io/clothing-ecommerce-platform/`; the admin console will be at `https://logeshgp.github.io/clothing-ecommerce-platform/console/`.

GitHub Pages serves only static files; it cannot run the API, persist product edits, enforce admin access or store uploaded photos. The external API is required for live catalogues, administrator sign-in and uploads. Without `VITE_API_URL`, the site shows a clearly labelled preview catalogue and the admin cannot sign in.

For a custom domain, add the exact HTTPS **origin** to the API CORS settings described below and configure that domain in GitHub Pages. The admin and storefront share the same browser origin under Pages.

## Deploy the API to Render

The repository includes [`render.yaml`](./render.yaml), a Render Blueprint for the API. It uses Node.js 22, a persistent disk for the SQLite database and uploaded photos, exact GitHub Pages CORS origins, secure production cookies and the `/api/health` health check. Render persistent disks require a paid web-service plan; check current Render pricing before creating the service.

1. Push the project to the `main` branch and open the [Render Dashboard](https://dashboard.render.com/).
2. Choose **New → Blueprint**, connect the `logeshgp/clothing-ecommerce-platform` repository, and select the `main` branch.
3. Review the `clothing-ecommerce-api` web service and its persistent disk from `render.yaml`. Confirm the plan and disk charges before applying.
4. When prompted for the unsynced `ADMIN_EMAILS` and `BOOTSTRAP_PASSWORD` values, enter the administrator's email address and a unique, long password. Do not put the password in GitHub or source files.
5. Apply the Blueprint and wait for the first deploy to finish. In the Render service dashboard, copy its HTTPS URL, such as `https://clothing-ecommerce-api.onrender.com`.
6. Open **GitHub → Settings → Secrets and variables → Actions → Variables** and set `VITE_API_URL` to that API origin only (no trailing slash or `/api` path).
7. Rerun **Deploy storefront and admin to GitHub Pages** from the repository's Actions tab.
8. Verify `https://YOUR-API.onrender.com/api/health` returns JSON with `"ok": true`, then visit `https://logeshgp.github.io/clothing-ecommerce-platform/console/` and sign in with the configured email and bootstrap password.

Keep the `ADMIN_EMAILS` allowlist restricted to staff. Set or rotate secrets from the Render dashboard; never commit production credentials. Keep `WHATSAPP_PROVIDER=log` (or omit it): customer orders use WhatsApp Click-to-Chat drafts, which the customer explicitly reviews and sends. No WhatsApp API credentials are needed for that flow.

### Other Node.js hosts

If using another trusted HTTPS host instead, the API needs a persistent disk/volume because SQLite and uploaded photos are stored on local disk. Configure these environment variables on the API host (never in the frontend or GitHub Pages):

| Variable | Required production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Supplied by the host |
| `STORE_ORIGINS` | Exact storefront origin, e.g. `https://logeshgp.github.io` |
| `ADMIN_ORIGINS` | Exact admin origin; same Pages origin, e.g. `https://logeshgp.github.io` |
| `ALLOW_LAN_ORIGINS` | `false` |
| `COOKIE_SECURE` | `true` |
| `ADMIN_EMAILS` | Comma-separated administrator email allowlist |
| `SUPPORT_EMAILS` | Comma-separated support email allowlist, or blank |
| `BOOTSTRAP_PASSWORD` | Long, unique initial staff password |
| `DATA_DIR` | Persistent disk directory |
| `DB_FILE` | Persistent database file, e.g. `/var/data/store.db` |
| `UPLOAD_DIR` | Persistent directory, e.g. `/var/data/uploads` |

The storefront has no online payment flow; payment checkout API requests are disabled.

### Cross-origin administrator sessions

The API is normally on a different host from GitHub Pages. In production the API therefore sets `Secure; SameSite=None` session cookies; exact CORS origins and CSRF tokens protect authenticated changes. Some browsers or privacy configurations block third-party cookies, which can prevent admin sign-in. For more reliable sign-in, configure a custom storefront domain and an API hostname under the same registrable domain (for example, `shop.example.com` and `api.example.com`), then update `STORE_ORIGINS`, `ADMIN_ORIGINS` and `VITE_API_URL` to those HTTPS origins. Never solve cookie problems by enabling wildcard credentialed CORS or disabling CSRF.

## Configure the store

1. Sign into `/console/` using an email in `ADMIN_EMAILS` and the bootstrap password. Use the API's email-code sign-in only after configuring a real email delivery provider.
2. In **Storefront & WhatsApp**, set the actual brand name, contact information, seller legal name, business address, GSTIN if applicable, and grievance contact.
3. Add one or more WhatsApp contacts with country code and digits; enable only verified contacts and then enable WhatsApp enquiries.
4. In **Products & stock**, add or edit each product, upload a photo for each colour, set the price and stock for every colour/size.
5. In **Promotions**, configure wholesale minimum quantity, quantity discount, optional store-wide promotion and promo codes.
6. Edit storefront announcements and promotional banner settings. Verify the public storefront, privacy notice and terms page before sharing the link.

Uploaded files must be JPEG, PNG, WebP or AVIF and no larger than 4 MB. The server uses generated filenames and validates image signatures instead of trusting browser-provided file names or MIME types.

## Useful commands

```sh
npm run dev             # storefront, http://localhost:5173/
npm run dev:console     # local admin UI, http://localhost:5174/
npm run dev:api         # local API, http://localhost:4000/
npm run build           # storefront production bundle, dist/
npm run build:console   # admin production bundle, dist-console/
npm run preview         # preview storefront production bundle
```

## Important operational notes

- Storefront data and administration require the API; do not treat GitHub Pages as a database or secure admin host.
- The customer prepares a WhatsApp draft, reviews its recipient and contents, and presses Send. This website cannot claim that a message was sent or an order accepted.
- Configure durable backups for both the SQLite database and uploaded-photo directory. Restrict server and hosting dashboard access.
- Never commit `.env`, production secrets, customer information, database files, or uploaded customer/business data.
- Replace sample product photos and descriptions with assets and claims that the business is authorised to publish.
- The website is not legal, tax or accounting advice. Confirm applicable Indian consumer-protection, e-commerce, privacy/data-protection, GST, advertising and grievance requirements for the real operation.
