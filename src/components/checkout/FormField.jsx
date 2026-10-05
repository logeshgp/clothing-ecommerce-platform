import { classNames } from '../../utils/format';

/** Labelled input with inline error messaging, used across checkout and account forms. */
export function FormField({
  id,
  label,
  error,
  hint,
  className,
  as: Tag = 'input',
  children,
  ...props
}) {
  return (
    <div className={classNames('min-w-0', className)}>
      <label htmlFor={id} className="dnd-label">
        {label}
      </label>
      <Tag
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="dnd-field"
        {...props}
      >
        {children}
      </Tag>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-berry-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
