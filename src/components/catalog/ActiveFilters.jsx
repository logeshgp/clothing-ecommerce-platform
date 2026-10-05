import { formatPrice } from '../../utils/format';
import { PRICE_BOUNDS } from '../../data/taxonomy';
import { CloseIcon } from '../ui/Icons';

/** Removable chips summarising every filter currently applied. */
export function ActiveFilters({ filters, onChange, onClear }) {
  const chips = [];

  const pushArray = (key, prefix = '') =>
    filters[key].forEach((value) =>
      chips.push({
        key: `${key}-${value}`,
        label: `${prefix}${value}`,
        remove: () => onChange({ [key]: filters[key].filter((v) => v !== value) }),
      }),
    );

  pushArray('sizes', 'Size ');
  pushArray('colors');
  pushArray('fabrics');
  pushArray('fits');
  pushArray('gender');

  if (filters.maxPrice < PRICE_BOUNDS.max) {
    chips.push({
      key: 'price',
      label: `Under ${formatPrice(filters.maxPrice)}`,
      remove: () => onChange({ maxPrice: PRICE_BOUNDS.max }),
    });
  }
  if (filters.onSale) {
    chips.push({ key: 'onSale', label: 'On sale', remove: () => onChange({ onSale: false }) });
  }
  if (filters.inStock) {
    chips.push({ key: 'inStock', label: 'In stock', remove: () => onChange({ inStock: false }) });
  }
  if (filters.query) {
    chips.push({
      key: 'query',
      label: `"${filters.query}"`,
      remove: () => onChange({ query: '' }),
    });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 py-1.5 pl-3.5 pr-2.5 text-xs font-medium text-sand-100 transition-opacity hover:opacity-85"
        >
          {chip.label}
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-1 text-xs font-medium text-ink-500 underline underline-offset-4 hover:text-ink-900"
      >
        Clear all
      </button>
    </div>
  );
}
