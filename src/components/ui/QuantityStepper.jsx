import { classNames } from '../../utils/format';
import { MinusIcon, PlusIcon } from './Icons';

export function QuantityStepper({ value, onChange, min = 1, max = 10, size = 'md', label = 'Quantity' }) {
  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <div
      className={classNames(
        'inline-flex items-center rounded-full border border-sand-300 bg-white',
        size === 'sm' && 'text-sm',
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={classNames(
          buttonSize,
          'inline-flex items-center justify-center rounded-full transition-colors',
          'hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent',
        )}
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span
        className="min-w-8 text-center text-sm font-medium tabular-nums"
        aria-live="polite"
        aria-label={`${label}: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={classNames(
          buttonSize,
          'inline-flex items-center justify-center rounded-full transition-colors',
          'hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent',
        )}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
