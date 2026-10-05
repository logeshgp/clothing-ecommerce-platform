import { Link } from 'react-router-dom';
import { classNames } from '../../utils/format';

const VARIANTS = {
  dark: 'bg-ink-900 text-sand-100 hover:bg-ink-700 disabled:bg-ink-900/40',
  light: 'bg-sand-50 text-ink-900 hover:bg-white disabled:opacity-50',
  outline: 'border border-ink-900/20 text-ink-900 hover:border-ink-900 hover:bg-ink-900/5',
  ghost: 'text-ink-900 hover:bg-ink-900/5',
  danger: 'bg-berry-500 text-white hover:bg-berry-500/90',
};

const SIZES = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-sm',
};

/**
 * Renders a `<button>`, a router `<Link>` or an `<a>` depending on the props
 * given, so every call site shares the same visual language.
 */
export function Button({
  variant = 'dark',
  size = 'md',
  full = false,
  loading = false,
  className,
  children,
  to,
  href,
  disabled,
  ...props
}) {
  const classes = classNames(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide',
    'transition-all duration-200 ease-out active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    full && 'w-full',
    className,
  );

  const content = (
    <>
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}

export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={classNames(
        'inline-flex h-10 w-10 items-center justify-center rounded-full',
        'text-ink-900 transition-colors duration-200 hover:bg-ink-900/8',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
