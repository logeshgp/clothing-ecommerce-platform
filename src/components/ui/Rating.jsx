import { classNames } from '../../utils/format';
import { StarIcon } from './Icons';

export function Rating({ value = 0, count, size = 'sm', showValue = false, className }) {
  const starSize = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const rounded = Math.round(value);

  return (
    <div className={classNames('flex items-center gap-1.5', className)}>
      <div
        className="flex text-clay-500"
        role="img"
        aria-label={`Rated ${value.toFixed(1)} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= rounded} className={starSize} />
        ))}
      </div>
      {showValue && <span className="text-xs font-medium text-ink-700">{value.toFixed(1)}</span>}
      {count != null && <span className="text-xs text-ink-500">({count})</span>}
    </div>
  );
}
