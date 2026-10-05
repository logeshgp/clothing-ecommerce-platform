import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { colorImage, colorNames, sizesInStock, stockFor } from '../data/products';
import { CATEGORY_MAP } from '../data/taxonomy';
import { formatPrice } from '../utils/format';
import { assetUrl } from '../api/client';
import { SizePicker } from '../components/product/SizePicker';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ColorSwatchButton } from '../components/ui/ColorSwatch';
import { TrashIcon } from '../components/ui/Icons';

export default function Wishlist() {
  const wishlist = useWishlist();
  const { productsById } = useStore();
  const products = wishlist.ids.map((id) => productsById[id]).filter(Boolean);

  if (!products.length) {
    return (
      <div className="dnd-container py-10">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />
        <EmptyState
          mark="♡"
          title="Nothing saved yet."
          description="Tap the heart on any piece to keep it here for later."
          className="py-24"
        >
          <Button to="/shop">Browse the collection</Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="dnd-container py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-8">
        <div>
          <p className="dnd-eyebrow">Saved for later</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Your wishlist</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-ink-500">
            {products.length} {products.length === 1 ? 'piece' : 'pieces'}
          </p>
          <button
            type="button"
            onClick={wishlist.clear}
            className="text-sm font-medium text-ink-500 underline underline-offset-4 hover:text-ink-900"
          >
            Clear all
          </button>
        </div>
      </header>

      <ul className="mt-8 space-y-4">
        {products.map((product) => (
          <WishlistRow key={product.id} product={product} />
        ))}
      </ul>
    </div>
  );
}

function WishlistRow({ product }) {
  const colors = colorNames(product);
  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState(null);

  const { addItem, openCart } = useCart();
  const wishlist = useWishlist();
  const { notify } = useToast();

  const stockBySize = Object.fromEntries(
    product.sizes.map((s) => [s, stockFor(product, color, s)]),
  );
  const available = sizesInStock(product, color);

  function handleAdd() {
    if (!size) {
      notify('Choose a size first.', { tone: 'error' });
      return;
    }
    addItem(product, {
      size,
      color,
      quantity: 1,
      maxQuantity: Math.min(stockBySize[size], 10),
    });
    wishlist.remove(product.id);
    notify(`${product.name} moved to your bag.`, {
      tone: 'success',
      action: { label: 'View bag', onClick: openCart },
    });
  }

  return (
    <li className="flex flex-col gap-5 rounded-3xl border border-sand-300 bg-sand-50 p-5 sm:flex-row">
      <Link
        to={`/product/${product.slug}`}
        className="h-48 w-36 shrink-0 overflow-hidden rounded-2xl bg-sand-200"
      >
        <img
          src={assetUrl(colorImage(product, color))}
          alt={`${product.name} in ${color}`}
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="dnd-eyebrow">
              {CATEGORY_MAP[product.category]?.name ?? product.category}
            </p>
            <Link to={`/product/${product.slug}`} className="block text-lg font-semibold">
              {product.name}
            </Link>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold">{formatPrice(product.price)}</p>
            {product.compareAt && (
              <s className="text-xs text-ink-500">{formatPrice(product.compareAt)}</s>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {colors.map((option) => (
            <ColorSwatchButton
              key={option}
              color={option}
              selected={option === color}
              onSelect={(next) => {
                setColor(next);
                setSize(null);
              }}
            />
          ))}
        </div>

        <SizePicker
          sizes={product.sizes}
          value={size}
          onChange={setSize}
          stockBySize={stockBySize}
          size="sm"
        />

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
          <Button onClick={handleAdd} disabled={!available.length} size="sm">
            {available.length ? 'Move to bag' : 'Sold out'}
          </Button>
          <button
            type="button"
            onClick={() => {
              wishlist.remove(product.id);
              notify(`${product.name} removed from your wishlist.`);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-berry-500"
          >
            <TrashIcon className="h-4 w-4" /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}
