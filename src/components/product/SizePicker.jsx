import { classNames } from '../../utils/format';

/** Size selector that visually distinguishes available, low-stock and sold-out sizes. */
export function SizePicker({ sizes, value, onChange, stockBySize = {}, size = 'md' }) {
  const dimensions = size === 'sm' ? 'h-9 min-w-11 text-xs' : 'h-12 min-w-14 text-sm';

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((option) => {
        const stock = stockBySize[option] ?? 0;
        const soldOut = stock <= 0;
        const selected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => !soldOut && onChange(option)}
            disabled={soldOut}
            aria-pressed={selected}
            title={soldOut ? `${option} — sold out` : `${option} — ${stock} in stock`}
            className={classNames(
              dimensions,
              'relative inline-flex items-center justify-center rounded-xl border px-3 font-medium transition-all duration-200',
              selected
                ? 'border-ink-900 bg-ink-900 text-sand-100'
                : 'border-sand-300 bg-white hover:border-ink-900',
              soldOut &&
                'cursor-not-allowed border-sand-200 bg-sand-100 text-sand-400 hover:border-sand-200',
            )}
          >
            {option}
            {soldOut && (
              <span
                aria-hidden="true"
                className="absolute inset-x-1.5 top-1/2 h-px -rotate-12 bg-sand-400"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
