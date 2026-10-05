import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { featuredScore } from '../api/mockApi';
import { primaryImage } from '../data/products';
import { BRAND_VALUES, COLLECTIONS, STORY_BLOCKS } from '../data/collections';
import { ProductCard } from '../components/product/ProductCard';
import { QuickViewModal } from '../components/product/QuickViewModal';
import { Button } from '../components/ui/Button';
import { ArrowUpRightIcon } from '../components/ui/Icons';

export default function Home() {
  const { products, categories, settings } = useStore();
  const [quickView, setQuickView] = useState(null);

  const hero = settings.hero;
  const festive = settings.festiveOffer;

  const featured = useMemo(
    () => [...products].sort((a, b) => featuredScore(b) - featuredScore(a)).slice(0, 8),
    [products],
  );

  const newArrivals = useMemo(
    () => [...products].sort((a, b) => new Date(b.released) - new Date(a.released)).slice(0, 4),
    [products],
  );

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="dnd-container pt-6 pb-16 lg:pt-10" aria-labelledby="hero-title">
        <div className="relative overflow-hidden rounded-3xl bg-sand-200">
          <div className="absolute inset-0">
            <img src={hero.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/25 to-ink-900/10" />
          </div>

          <div className="relative flex min-h-[32rem] flex-col justify-end p-6 sm:p-10 lg:min-h-[40rem] lg:p-14">
            <div className="max-w-xl animate-fade-up space-y-5 text-sand-50">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-clay-400" />
                {hero.eyebrow}
              </p>
              <h1 id="hero-title" className="text-4xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
                {hero.titleLine1}
                <br />
                {hero.titleLine2}
              </h1>
              <p className="text-sm leading-relaxed text-sand-200 sm:text-base">
                {hero.bodyLine1}
                <br />
                {hero.bodyLine2}
              </p>
              <Button to={hero.ctaTo || '/shop'} variant="light" size="lg">
                {hero.ctaLabel} <ArrowUpRightIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-10 flex items-end justify-between gap-6 text-sand-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{hero.caption}</p>
              {festive?.active && (
                <p className="rounded-full bg-clay-500 px-4 py-1.5 text-xs font-semibold text-white">
                  {festive.label} · {festive.percent}% off
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Values marquee */}
      <section aria-label="Brand values" className="overflow-hidden border-y border-sand-200 py-4">
        <div className="flex w-max dnd-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {BRAND_VALUES.map((value) => (
                <span key={value} className="flex items-center">
                  <span className="px-6 text-sm font-medium text-ink-700">{value}</span>
                  <span className="text-clay-400">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ Categories */}
      <section className="dnd-container py-16" aria-labelledby="categories-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="dnd-eyebrow">Shop by category</p>
            <h2 id="categories-title" className="mt-2 text-3xl font-bold sm:text-4xl">
              Find your starting point.
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
          >
            View all pieces <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => {
            const sample = products.find((p) => p.category === category.slug);
            return (
              <Link
                key={category.slug}
                to={`/shop/${category.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand-200"
              >
                {sample && (
                  <img
                    src={primaryImage(sample)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-sand-50">
                  <p className="text-base font-semibold">{category.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-sand-300">{category.blurb}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------- Featured grid */}
      <section className="dnd-container py-8" aria-labelledby="featured-title">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="dnd-eyebrow">The DND edit</p>
            <h2 id="featured-title" className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">
              Good things,
              <br />
              in good company.
            </h2>
          </div>
          <p className="max-w-xs text-sm text-ink-500">
            Pieces to reach for, again and again — chosen by the people who made them.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {featured.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              onQuickView={setQuickView}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button to="/shop" variant="outline" size="lg">
            Explore all pieces ↓
          </Button>
        </div>
      </section>

      {/* ---------------------------------------------- Editorial banner */}
      <section className="dnd-container py-16">
        <div className="grid overflow-hidden rounded-3xl bg-ink-900 text-sand-100 lg:grid-cols-2">
          <div className="min-h-72 bg-sand-200 lg:min-h-[32rem]">
            <img
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=75"
              alt="Everyday essentials laid out"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-5 p-8 sm:p-12 lg:p-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-400">
              Browse the collection
            </p>
            <h2 className="text-3xl font-bold leading-tight sm:text-5xl">
              Good clothes.
              <br />
              Everyday fits.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-sand-300">
              Browse pants, trousers, three-quarter pants and track pants. Select your options and
              send a purchase enquiry to the seller.
            </p>

            <dl className="grid gap-5 pt-2 sm:grid-cols-3">
              {STORY_BLOCKS.map((block) => (
                <div key={block.title}>
                  <dt className="text-sm font-semibold">{block.title}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-sand-400">{block.body}</dd>
                </div>
              ))}
            </dl>

            <Button
              to={`/shop/${categories[1]?.slug ?? ''}`}
              variant="light"
              size="lg"
              className="mt-2 self-start"
            >
              Meet your new uniform <ArrowUpRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ New in */}
      <section className="dnd-container py-8" aria-labelledby="new-title">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="new-title" className="text-2xl font-bold sm:text-3xl">
            Just landed
          </h2>
          <Link to="/shop?sort=newest" className="text-sm font-medium underline underline-offset-4">
            See all new arrivals
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={setQuickView} />
          ))}
        </div>
      </section>

      <section className="dnd-container py-12" aria-labelledby="bulk-order-title">
        <div className="flex flex-col items-start justify-between gap-6 border-y border-sand-300 py-8 sm:flex-row sm:items-center">
          <div>
            <p className="dnd-eyebrow">For shops, teams and resellers</p>
            <h2 id="bulk-order-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
              Buying in quantity?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink-500">
              Share the styles and quantities you need. The seller will confirm availability and a wholesale quote.
            </p>
          </div>
          <Button to="/bulk-order" size="lg" className="shrink-0">
            Request wholesale pricing <ArrowUpRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* -------------------------------------------------- Collections */}
      <section className="dnd-container py-16" aria-labelledby="collections-title">
        <div className="mb-8">
          <p className="dnd-eyebrow">Curated edits</p>
          <h2 id="collections-title" className="mt-2 text-3xl font-bold sm:text-4xl">
            Collections to browse.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {COLLECTIONS.slice(0, 2).map((collection) => (
            <Link
              key={collection.slug}
              to={`/collections/${collection.slug}`}
              className="group relative aspect-[16/10] overflow-hidden rounded-3xl bg-sand-200"
            >
              <img
                src={collection.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 space-y-1.5 text-sand-50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-300">
                  Issue {collection.issue}
                </p>
                <h3 className="text-2xl font-bold">{collection.title}</h3>
                <p className="text-sm text-sand-200">{collection.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <QuickViewModal
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
      />
    </>
  );
}
