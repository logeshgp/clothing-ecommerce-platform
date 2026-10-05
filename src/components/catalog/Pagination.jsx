import { classNames } from '../../utils/format';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icons';

/** Windowed pagination: always shows first/last with an ellipsis in between. */
export function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  const pages = [];
  for (let i = 1; i <= pageCount; i += 1) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages.at(-1) !== '…') {
      pages.push('…');
    }
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 pt-12">
      <PageButton
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        label="Previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </PageButton>

      {pages.map((value, index) =>
        value === '…' ? (
          <span key={`gap-${index}`} className="px-2 text-sm text-ink-500">
            …
          </span>
        ) : (
          <PageButton
            key={value}
            onClick={() => onChange(value)}
            active={value === page}
            label={`Page ${value}`}
          >
            {value}
          </PageButton>
        ),
      )}

      <PageButton
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        label="Next page"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </PageButton>
    </nav>
  );
}

function PageButton({ children, onClick, active, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={classNames(
        'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors',
        active ? 'bg-ink-900 text-sand-100' : 'hover:bg-sand-200',
        disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
      )}
    >
      {children}
    </button>
  );
}
