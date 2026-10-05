import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../ui/Icons';

/** @param {{items: {label: string, to?: string}[]}} props */
export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.to && !isLast ? (
              <Link to={item.to} className="transition-colors hover:text-ink-900">
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-ink-900' : ''}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRightIcon className="h-3.5 w-3.5 text-sand-400" />}
          </span>
        );
      })}
    </nav>
  );
}
