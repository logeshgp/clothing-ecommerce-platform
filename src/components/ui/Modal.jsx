import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { classNames } from '../../utils/format';
import { IconButton } from './Button';
import { CloseIcon } from './Icons';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

/**
 * Accessible dialog: portal-rendered, scroll-locked, Esc-dismissable and
 * focus-trapped. Returns focus to the trigger element on close.
 */
export function Modal({ open, onClose, title, children, width = 'md', className }) {
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;

    triggerRef.current = document.activeElement;
    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector(FOCUSABLE);
    (firstFocusable ?? panel)?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-900/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={classNames(
          'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-sand-50 shadow-[var(--shadow-lift)]',
          'animate-fade-up',
          WIDTHS[width],
          className,
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-sand-200 bg-sand-50/95 px-6 py-4 backdrop-blur">
            <h2 className="text-lg font-semibold">{title}</h2>
            <IconButton label="Close" onClick={onClose}>
              <CloseIcon className="h-5 w-5" />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
