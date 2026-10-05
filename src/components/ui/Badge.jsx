import { BADGE_STYLES } from '../../data/taxonomy';
import { classNames } from '../../utils/format';

export function Badge({ tag, className }) {
  const style = BADGE_STYLES[tag];
  if (!style) return null;

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

export function Pill({ children, className, ...props }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-sand-50 px-3 py-1 text-xs text-ink-700',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
