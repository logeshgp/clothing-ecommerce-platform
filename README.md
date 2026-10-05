# Clothing ecommerce platform

A responsive React storefront for pants, trousers, 3/4 pants and track pants. The default GitHub Pages setup includes a GitHub-managed admin page and does not require a third-party API or hosting provider.

## What is included

- Product browsing, search, categories, sizing, cart and wishlist.
- WhatsApp purchase enquiries: customers review and send a pre-filled draft; this website does not collect payment or claim an order is placed.
- A separate wholesale enquiry page and configurable quantity discount.
- A GitHub-managed admin page at `/console/` with links to edit products, store settings, WhatsApp contacts, promotions, announcements and categories through GitHub.
- Product photos committed to `public/uploads/` and served by GitHub Pages.
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

The repository includes [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml). It builds the storefront and GitHub-managed admin page and deploys both as static files on every push to `main`. The storefront reads products and settings from the committed source files; no API URL or third-party runtime is needed.

1. Push the project files to the `main` branch of `logeshgp/clothing-ecommerce-platform`.
2. In GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions**, run **Deploy storefront and admin to GitHub Pages** (or push another commit), and wait for the Pages deployment to finish.
4. The storefront will be at `https://logeshgp.github.io/clothing-ecommerce-platform/`; the admin page will be at `https://logeshgp.github.io/clothing-ecommerce-platform/console/`.

No `VITE_API_URL`, backend service or external hosting account is needed for this mode.

## Manage the store through GitHub

1. Open the admin page and sign in to GitHub in the same browser.
2. Choose **Edit on GitHub** for products, store settings, promotions or categories. Only repository collaborators with write access can save changes.
3. Edit the source file. GitHub lets you commit directly to `main` or create a pull request for review.
4. For photos, choose **Upload photos on GitHub**, select authorised JPEG, PNG, WebP or AVIF files, and commit them into `public/uploads/`. Update the relevant image field in the product or settings file to `/uploads/filename.webp`.
5. A successful commit to `main` automatically triggers the Pages workflow. Check **Actions** and wait for it to finish before checking the site.

Store data is in:

- `src/data/products.js` — product details, prices, colour images and stock.
- `src/data/settings.js` — store identity, WhatsApp contacts, home page, banner and announcements.
- `src/data/promoCodes.js` — promo codes.
- `src/data/taxonomy.js` — categories, sizes and shared product options.

These are JavaScript source files rather than a form-based database. GitHub Pages is static hosting: storefront and admin files are public, while GitHub account/repository permissions protect editing. Do not put passwords, customer details or private secrets in the repository. This GitHub-only mode has no separate website admin password, runtime database or direct photo-upload widget.

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

- In GitHub-only mode, edits are source changes committed to the repository; there is no runtime database or private admin backend.
- Customers prepare a WhatsApp draft, review its recipient and contents, and press Send. This website cannot claim that a message was sent or an order accepted.
- Never commit `.env`, production secrets, customer information, database files or private customer/business data.
- Replace sample product photos and descriptions with assets and claims that the business is authorised to publish.
- The website is not legal, tax or accounting advice. Confirm applicable Indian consumer-protection, e-commerce, privacy/data-protection, GST, advertising and grievance requirements for the real operation.
