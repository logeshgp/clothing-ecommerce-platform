const REPOSITORY = 'https://github.com/logeshgp/clothing-ecommerce-platform';

const EDIT_LINKS = [
  {
    title: 'Products, prices, stock and product photos',
    path: 'src/data/products.js',
    description: 'Add or edit products in the RAW list. Keep stock quantities keyed by colour and size.',
  },
  {
    title: 'Store details, WhatsApp contacts, hero, banner and announcements',
    path: 'src/data/settings.js',
    description: 'Set the store name, WhatsApp enabled flag and contacts, home page copy, and announcements.',
  },
  {
    title: 'Promotions and promo codes',
    path: 'src/data/promoCodes.js',
    description: 'Add, edit or remove the store-wide promo code list.',
  },
  {
    title: 'Product categories and sizes',
    path: 'src/data/taxonomy.js',
    description: 'Update the category labels and other shared catalogue options.',
  },
];

export function GitHubOnlyAdmin() {
  return (
    <main className="min-h-screen bg-sand-100">
      <header className="bg-ink-900 px-5 py-8 text-sand-50 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-300">
            GitHub-managed store
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Store administration</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sand-200">
            Sign in to GitHub with an account that can edit this repository. Your committed changes
            are published automatically by GitHub Pages.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8">
        <section
          aria-labelledby="how-heading"
          className="rounded-2xl border border-sand-300 bg-white p-5 sm:p-6"
        >
          <h2 id="how-heading" className="text-lg font-semibold">How to make a change</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-700">
            <li>Open the relevant source file below and edit it in GitHub.</li>
            <li>Commit the change to <code>main</code> (or open a pull request for review).</li>
            <li>Wait for the Pages deployment workflow to finish, then refresh the storefront.</li>
          </ol>
        </section>

        <section aria-labelledby="content-heading">
          <h2 id="content-heading" className="text-xl font-semibold">Edit store content</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {EDIT_LINKS.map((item) => (
              <li key={item.path} className="rounded-2xl border border-sand-300 bg-white p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.description}</p>
                <a
                  href={`${REPOSITORY}/edit/main/${item.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Edit on GitHub
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="photos-heading"
          className="rounded-2xl border border-sand-300 bg-white p-5 sm:p-6"
        >
          <h2 id="photos-heading" className="text-lg font-semibold">Upload store photos</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            Upload authorised JPEG, PNG, WebP or AVIF files to <code>public/uploads/</code> using
            GitHub’s file upload. Then set the related image value in the product or settings file
            to <code>/uploads/your-file.webp</code>. The site serves committed photos from GitHub
            Pages; the static console cannot upload directly to the repository.
          </p>
          <a
            href={`${REPOSITORY}/upload/main/public/uploads`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-full border border-ink-900/20 px-4 py-2 text-sm font-medium hover:bg-sand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Upload photos on GitHub
          </a>
        </section>

        <p className="rounded-2xl bg-sand-200 p-5 text-sm leading-relaxed text-ink-700">
          GitHub Pages is static hosting: this page does not have a separate admin password or
          database. GitHub repository permissions protect editing; changes are public with the
          storefront. Do not add customer information, passwords or secrets to store files.
        </p>

        <a
          href="https://logeshgp.github.io/clothing-ecommerce-platform/"
          className="inline-flex text-sm font-medium underline underline-offset-4"
        >
          View storefront
        </a>
      </div>
    </main>
  );
}
