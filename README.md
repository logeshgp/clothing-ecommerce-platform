# Clothing ecommerce platform

A responsive React storefront for pants, trousers, 3/4 pants and track pants. The default GitHub Pages setup includes a no-login admin editor and does not require a third-party API or hosting provider.

## What is included

- Product browsing, search, categories, sizing, cart and wishlist.
- The initial published catalog shows exactly four products: one pants style, one trouser, one track pant and one 3/4 pant. More can be added in the admin page.
- Combined bag and wishlist view with per-item selection; only checked bag items go to the estimate and WhatsApp enquiry.
- Product-level wholesale pricing: the configured discount applies once a single product reaches the minimum quantity, with one-piece and bulk totals shown on product detail.
- Feedback page at `/feedback`, which prepares a WhatsApp draft for the owner.
- WhatsApp purchase enquiries: customers review and send a pre-filled draft; this website does not collect payment or claim an order is placed.
- A separate wholesale enquiry page and configurable quantity discount.
- An admin editor at `/console/` for products, storefront visibility, prices, promotions, announcements, wholesale settings and WhatsApp contacts.
- Product photos committed to `public/images/` and served by GitHub Pages; published store data is in `public/store-data.json`.
- Privacy notice and terms templates. The seller must complete accurate business details and review disclosures before launch.

Indian legal requirements depend on the seller, products, sales model and actual data practices. Have the final terms, privacy notice, tax treatment, product pricing and grievance disclosures reviewed by a qualified professional before accepting enquiries.

## Run locally

Use Node.js 22 or later.

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Start the storefront and GitHub-managed console preview:

   ```sh
   npm run dev
   ```

   ```sh
   npm run dev:console
   ```

3. Visit the storefront at `http://localhost:5173/` and the console preview at `http://localhost:5174/`.

For optional local API development, copy `.env.example` to `.env`, set a unique bootstrap password, start `npm run dev:api`, and launch the storefront and console with `VITE_GITHUB_ONLY=false npm run dev` and `VITE_GITHUB_ONLY=false npm run dev:console`. The API is not used by the GitHub Pages deployment.

## Deploy to GitHub Pages

The repository includes [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml). It builds the storefront and admin page and deploys both as static files on every push to `main`. The storefront reads the committed `public/store-data.json` when present, and otherwise starts with the bundled sample catalogue. No API URL or third-party runtime is needed.

1. Push the project files to the `main` branch of `logeshgp/clothing-ecommerce-platform`.
2. In GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions**, run **Deploy storefront and admin to GitHub Pages** (or push another commit), and wait for the Pages deployment to finish.
4. The storefront will be at `https://logeshgp.github.io/clothing-ecommerce-platform/`; the admin page will be at `https://logeshgp.github.io/clothing-ecommerce-platform/console/`.

No `VITE_API_URL`, backend service or external hosting account is needed for this mode.

## Manage the store and upload photos

The `/console/` admin page itself does not require a login. It keeps edits in the current browser and can export a `store-data.json` file. GitHub Pages cannot write to your repository anonymously, so publishing is done through GitHub's normal upload and commit screens:

1. Open `https://logeshgp.github.io/clothing-ecommerce-platform/console/`.
2. Use **Products**, **Storefront** and **Offers & messages** to edit products, prices, stock, visibility flags, home hero, banner, announcements, promotions, wholesale settings, seller details and WhatsApp contacts. The shop defaults to **New arrivals** sort. Drafts stay in this browser; download the JSON before switching browsers or clearing site data.
3. To select a photo, choose **Choose photo** beside a product, hero, banner or collection. The editor previews it and adds a unique timestamped `/images/...` path to the draft. Choose **Download photo with suggested filename** to get a copy ready for GitHub, then use **Upload photo on GitHub** to upload that downloaded copy.
4. In GitHub's upload screen, commit each photo to `public/images/`. The image path is already added to the draft; the file itself must be uploaded and committed by you.
5. In the admin page's **Publish** tab, choose **Download store data**. Upload it as `public/store-data.json` the first time. For later changes, open the existing file on GitHub, replace its contents with the downloaded JSON, and commit. Use a GitHub account with write permission to this repository; you can commit to `main` or create a pull request.
6. If photos and data are uploaded in separate commits, wait for the deployment triggered by the last commit. In **Actions**, confirm that the Pages workflow completed before checking the storefront.

Opening the admin page does not require signing in. A GitHub account with repository write permission is still required on GitHub's own commit screen; no credential is embedded in the website. Changes become shared only after the files are committed and Pages redeploys. The initial sample catalogue remains as a fallback until the first `store-data.json` is committed.

The sample catalogue currently covers four categories: pants, trousers, 3/4 pants and track pants. WhatsApp enquiries are enabled by default and point to `93613321260`; clicking the action opens a pre-filled WhatsApp draft for the customer to review and send. The admin editor can change that contact or disable WhatsApp.

## Optional API mode

The repository also contains a Node.js API for deployments that choose a separate persistent API host. [`render.yaml`](./render.yaml) is an optional Render Blueprint; it is not required by the GitHub-only Pages workflow. A hosted API needs durable storage for its SQLite database and uploaded photos, plus careful configuration of secrets, access, backups and HTTPS.

## Useful commands

```sh
npm run dev             # storefront, http://localhost:5173/
npm run dev:console     # local admin preview, http://localhost:5174/
npm run dev:api         # optional local API, http://localhost:4000/
npm run build           # storefront production bundle, dist/
npm run build:console   # admin production bundle, dist-console/
npm run preview         # preview storefront production bundle
```

## Important operational notes

- In GitHub-only mode, the browser draft is local until exported and committed to the repository; there is no runtime database or private admin backend.
- Customers prepare a WhatsApp draft, review its recipient and contents, and press Send. This website cannot claim that a message was sent or an order accepted.
- Never commit `.env`, production secrets, customer information, database files or private customer/business data.
- Replace sample product photos and descriptions with assets and claims that the business is authorised to publish.
- The website is not legal, tax or accounting advice. Confirm applicable Indian consumer-protection, e-commerce, privacy/data-protection, GST, advertising and grievance requirements for the real operation.
