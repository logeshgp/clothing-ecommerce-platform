import { Link, Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { ArrowUpRightIcon } from '../components/ui/Icons';
import { assetUrl } from '../api/client';

export default function Collections() {
  const { settings, collections } = useStore();
  const page = settings.collectionsPage ?? {};

  if (settings.visibility?.collections === false) return <Navigate to="/" replace />;

  return (
    <div className="dnd-container py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Collections' }]} />

      <header className="mt-6 max-w-2xl border-b border-sand-200 pb-10">
        <p className="dnd-eyebrow">{page.eyebrow ?? 'Curated edits'}</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-6xl">
          {page.title ?? 'Collections, issue by issue.'}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-500">{page.description ?? 'Each edit is a small group of pieces chosen to work together — a starting point rather than a rulebook.'}</p>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {collections.map((collection, index) => (
          <Link
            key={collection.slug}
            to={`/collections/${collection.slug}`}
            className={`group relative overflow-hidden rounded-3xl bg-sand-200 ${
              index === 0 ? 'md:col-span-2 md:aspect-[21/9]' : 'aspect-[4/3]'
            }`}
          >
            <img
              src={assetUrl(collection.image)}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent" />

            <div className="absolute inset-x-6 bottom-6 space-y-2 text-sand-50 sm:inset-x-8 sm:bottom-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-300">
                Issue {collection.issue} · {collection.productIds.length} pieces
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl">{collection.title}</h2>
              <p className="max-w-md text-sm text-sand-200">{collection.description}</p>
              <span className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium underline underline-offset-4">
                Explore the edit <ArrowUpRightIcon className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
