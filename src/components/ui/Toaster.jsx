import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { classNames } from '../../utils/format';
import { CloseIcon, CheckIcon } from './Icons';

const TONES = {
  default: 'bg-ink-900 text-sand-100',
  success: 'bg-moss-500 text-white',
  error: 'bg-berry-500 text-white',
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={classNames(
            'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3',
            'shadow-[var(--shadow-lift)] animate-fade-up',
            TONES[toast.tone] ?? TONES.default,
          )}
        >
          {toast.tone === 'success' && <CheckIcon className="h-4 w-4 shrink-0" />}
          <p className="flex-1 text-sm leading-snug">{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action.onClick();
                dismiss(toast.id);
              }}
              className="shrink-0 text-xs font-semibold underline underline-offset-4"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
