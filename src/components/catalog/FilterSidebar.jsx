import { useStore } from '../../context/StoreContext';
import { colorNames } from '../../data/products';
import { FABRICS, FITS, GENDERS, PRICE_BOUNDS, SIZES } from '../../data/taxonomy';
import { classNames, formatPrice } from '../../utils/format';
import { ColorSwatch } from '../ui/ColorSwatch';

/**
 * Faceted filter panel. Every control is driven by the URL, so filters survive
 * refreshes, deep links and the browser back button.
 */
export function FilterSidebar({ filters, facets, onChange, onClear, activeCount }) {
  const { products } = useStore();

  const allColors = [...new Set(products.flatMap(colorNames))].sort();
  const allFabrics = [...new Set([...products.map((p) => p.fabric), ...FABRICS])].sort();

  function toggleArray(key, value) {
    const current = filters[key];
    onChange({
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <p className="dnd-eyebrow">Refine by</p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-ink-500 underline underline-offset-4 hover:text-ink-900"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup legend="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const count = facets?.sizes?.[size] ?? 0;
            const selected = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleArray('sizes', size)}
                disabled={!count && !selected}
                aria-pressed={selected}
                className={classNames(
                  'h-10 min-w-11 rounded-xl border px-3 text-sm font-medium transition-all',
                  selected
                    ? 'border-ink-900 bg-ink-900 text-sand-100'
                    : 'border-sand-300 bg-white hover:border-ink-900',
                  !count && !selected && 'cursor-not-allowed opacity-35 hover:border-sand-300',
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup legend="Colour">
        <div className="grid grid-cols-2 gap-2">
          {allColors.map((color) => {
            const count = facets?.colors?.[color] ?? 0;
            const selected = filters.colors.includes(color);
            return (
              <button
                key={color}
                type="button"
                onClick={() => toggleArray('colors', color)}
                disabled={!count && !selected}
                aria-pressed={selected}
                className={classNames(
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                  selected ? 'bg-ink-900 text-sand-100' : 'hover:bg-sand-200',
                  !count && !selected && 'cursor-not-allowed opacity-35',
                )}
              >
                <ColorSwatch color={color} size="sm" />
                <span className="truncate">{color}</span>
                <span className="ml-auto opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup
        legend={
          <span className="flex w-full items-center justify-between">
            Price
            <span className="font-normal normal-case tracking-normal text-ink-500">
              Up to {formatPrice(filters.maxPrice)}
            </span>
          </span>
        }
      >
        <input
          type="range"
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={PRICE_BOUNDS.step}
          value={filters.maxPrice}
          onChange={(event) => onChange({ maxPrice: Number(event.target.value) })}
          aria-label="Maximum price"
          className="w-full accent-[var(--color-ink-900)]"
        />
        <div className="mt-1 flex justify-between text-[11px] text-ink-500">
          <span>{formatPrice(PRICE_BOUNDS.min)}</span>
          <span>{formatPrice(PRICE_BOUNDS.max)}+</span>
        </div>
      </FilterGroup>

      <FilterGroup legend="Collection">
        <CheckboxList
          options={GENDERS.map((g) => ({
            value: g.slug,
            label: g.name,
            count: facets?.genders?.[g.slug] ?? 0,
          }))}
          selected={filters.gender}
          onToggle={(value) => toggleArray('gender', value)}
        />
      </FilterGroup>

      <FilterGroup legend="Fit">
        <CheckboxList
          options={FITS.map((f) => ({
            value: f.slug,
            label: f.name,
            count: facets?.fits?.[f.slug] ?? 0,
          }))}
          selected={filters.fits}
          onToggle={(value) => toggleArray('fits', value)}
        />
      </FilterGroup>

      <FilterGroup legend="Fabric">
        <CheckboxList
          options={allFabrics.map((fabric) => ({
            value: fabric,
            label: fabric,
            count: facets?.fabrics?.[fabric] ?? 0,
          }))}
          selected={filters.fabrics}
          onToggle={(value) => toggleArray('fabrics', value)}
        />
      </FilterGroup>

      <FilterGroup legend="Availability">
        <CheckboxList
          options={[
            { value: 'onSale', label: 'On sale', count: facets?.onSale ?? 0 },
            { value: 'inStock', label: 'In stock only', count: facets?.inStock ?? 0 },
          ]}
          selected={[filters.onSale && 'onSale', filters.inStock && 'inStock'].filter(Boolean)}
          onToggle={(value) => onChange({ [value]: !filters[value] })}
        />
      </FilterGroup>

      <p className="rounded-2xl bg-sand-200 p-4 text-xs leading-relaxed text-ink-500">
        Designed for the long run.
        <br />
        Made in small, considered runs.
      </p>
    </div>
  );
}

function FilterGroup({ legend, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="dnd-eyebrow mb-2 w-full">{legend}</legend>
      {children}
    </fieldset>
  );
}

function CheckboxList({ options, selected, onToggle }) {
  return (
    <ul className="space-y-1">
      {options.map((option) => {
        const checked = selected.includes(option.value);
        const disabled = !option.count && !checked;

        return (
          <li key={option.value}>
            <label
              className={classNames(
                'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors',
                disabled ? 'cursor-not-allowed opacity-35' : 'hover:bg-sand-200',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(option.value)}
                className="h-4 w-4 shrink-0 rounded border-sand-400 accent-[var(--color-ink-900)]"
              />
              <span className="flex-1 truncate">{option.label}</span>
              <span className="text-xs text-ink-500">{option.count}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
