import { classNames } from '../../utils/format';

export function EmptyState({ mark = '○', title, description, children, className }) {
  return (
    <div className={classNames('flex flex-col items-center gap-4 py-16 text-center', className)}>
      <span className="text-3xl text-sand-400" aria-hidden="true">
        {mark}
      </span>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}
