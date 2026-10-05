import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchProducts } from '../../api/mockApi';
import { useStore } from '../../context/StoreContext';
import { useDebounce } from '../../hooks/useDebounce';
import { primaryImage } from '../../data/products';
import { CATEGORY_MAP } from '../../data/taxonomy';
import { formatPrice } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { SearchIcon } from '../ui/Icons';

const SUGGESTIONS = ['T-shirt', 'Track pants', 'Trousers', '3/4 pants', 'Cotton', 'On sale'];

export function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);
  const { products } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo(
    () => searchProducts(products, debounced),
    [products, debounced],
  );

  function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} width="lg" className="!bg-sand-50">
      <form onSubmit={handleSubmit} className="border-b border-sand-200 px-6 py-5">
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <div className="flex items-center gap-3">
          <SearchIcon className="h-5 w-5 shrink-0 text-ink-500" />
          <input
            id="site-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for tees, trousers, track pants…"
            autoComplete="off"
            className="w-full bg-transparent text-lg outline-none placeholder:text-sand-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-xs text-ink-500 hover:text-ink-900"
          >
            Esc
          </button>
        </div>
      </form>

      <div className="max-h-[60vh] overflow-y-auto p-6">
        {!query.trim() && (
          <div className="space-y-3">
            <p className="dnd-eyebrow">Popular searches</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-sand-300 px-3.5 py-1.5 text-sm transition-colors hover:border-ink-900 hover:bg-white"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <p className="text-sm text-ink-500">
            No pieces match "{query}". Try a fabric, colour or category.
          </p>
        )}

        {results.length > 0 && (
          <ul className="space-y-1">
            {results.map((product) => (
              <li key={product.id}>
                <Link
                  to={`/product/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-sand-100"
                >
                  <img
                    src={primaryImage(product)}
                    alt=""
                    className="h-16 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-ink-500">
                      {CATEGORY_MAP[product.category]?.name ?? product.category} · {product.fabric}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">{formatPrice(product.price)}</span>
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full rounded-xl border border-sand-300 py-2.5 text-sm font-medium transition-colors hover:border-ink-900"
              >
                See all results for "{query}"
              </button>
            </li>
          </ul>
        )}
      </div>
    </Modal>
  );
}
