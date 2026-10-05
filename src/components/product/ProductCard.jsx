import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { colorImage, colorNames, isInStock } from '../../data/products';
import { CATEGORY_MAP } from '../../data/taxonomy';
import { classNames, formatPrice } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { ColorSwatch } from '../ui/ColorSwatch';
import { HeartIcon } from '../ui/Icons';

/**
 * Catalog tile. Hovering a colour dot previews that colourway without
 * navigating, which keeps browsing fast on the grid.
 */
export function ProductCard({ product, onQuickView, priority = false, layout = 'grid' }) {
  const colors = colorNames(product);
  const [activeColor, setActiveColor] = useState(colors[0]);
  const wishlist = useWishlist();
  const { notify } = useToast();

  const image = colorImage(product, activeColor);
  const saved = wishlist.has(product.id);
  const primaryTag = product.tags?.[0];
  const inStock = isInStock(product);
  const categoryName = CATEGORY_MAP[product.category]?.name ?? product.category;

  function handleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();
    const added = wishlist.toggle(product.id);
    notify(added ? `${product.name} saved to wishlist.` : `${product.name} removed from wishlist.`, {
      tone: added ? 'success' : 'default',
    });
  }

  if (layout === 'list') {
    return (
      <Link
        to={`/product/${product.slug}`}
        className="group flex gap-5 rounded-2xl border border-transparent p-3 transition-colors hover:border-sand-300 hover:bg-sand-50"
      >
        <div className="relative aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-xl bg-sand-200 sm:w-40">
          <img
            src={image}
            alt={`${product.name} in ${activeColor}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div className="space-y-1.5">
            <p className="dnd-eyebrow">{categoryName}</p>
            <h3 className="truncate text-base font-semibold">{product.name}</h3>
            <p className="line-clamp-2 text-sm text-ink-500">{product.blurb}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <PriceBlock product={product} />
            <div className="flex gap-1.5">
              {colors.map((color) => (
                <ColorSwatch key={color} color={color} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="group relative flex flex-col">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand-200">
          <img
            src={image}
            alt={`${product.name} in ${activeColor}`}
            loading={priority ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
          />

          {primaryTag && (
            <div className="absolute left-3 top-3">
              <Badge tag={primaryTag} />
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-sand-100/75">
              <span className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-sand-100">
                Sold out
              </span>
            </div>
          )}

          {onQuickView && inStock && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onQuickView(product);
              }}
              className={classNames(
                'absolute inset-x-3 bottom-3 rounded-full bg-sand-50/95 py-2.5 text-xs font-semibold',
                'opacity-0 shadow-[var(--shadow-soft)] backdrop-blur transition-all duration-300',
                'translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100',
                'max-lg:hidden',
              )}
            >
              Quick view
            </button>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleWishlist}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        className={classNames(
          'absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full',
          'bg-sand-50/90 backdrop-blur transition-all duration-200 hover:scale-110',
          saved ? 'text-berry-500' : 'text-ink-700',
        )}
      >
        <HeartIcon filled={saved} className="h-4.5 w-4.5" />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/product/${product.slug}`} className="min-w-0">
            <h3 className="truncate text-sm font-semibold sm:text-base">{product.name}</h3>
          </Link>
          <PriceBlock product={product} align="right" />
        </div>

        <p className="text-xs text-ink-500">
          {product.fabric} · {product.fit} fit
        </p>

        <div className="mt-1 flex items-center gap-1.5">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onMouseEnter={() => setActiveColor(color)}
              onFocus={() => setActiveColor(color)}
              onClick={() => setActiveColor(color)}
              aria-label={`Preview ${color}`}
            >
              <ColorSwatch color={color} size="sm" selected={color === activeColor} />
            </button>
          ))}
          <span className="ml-auto text-[11px] text-ink-500">{activeColor}</span>
        </div>
      </div>
    </article>
  );
}

function PriceBlock({ product, align = 'left' }) {
  return (
    <div className={classNames('shrink-0 text-sm', align === 'right' && 'text-right')}>
      {product.compareAt ? (
        <span className="flex items-baseline gap-2">
          <span className="font-semibold text-berry-500">{formatPrice(product.price)}</span>
          <s className="text-xs text-ink-500">{formatPrice(product.compareAt)}</s>
        </span>
      ) : (
        <span className="font-semibold">{formatPrice(product.price)}</span>
      )}
    </div>
  );
}
