import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { classNames } from '../../utils/format';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Slide-over panel used for the bag and the mobile navigation. */
export function Drawer({ open, onClose, side = 'right', label, children, className }) {
  const panelRef = useRef(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;

    const panel = panelRef.current;
    const timer = setTimeout(() => panel?.querySelector(FOCUSABLE)?.focus(), 80);

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return createPortal(
    <div
      className={classNames('fixed inset-0 z-[80]', !open && 'pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={classNames(
          'absolute inset-0 bg-ink-900/45 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={classNames(
          'absolute top-0 flex h-full w-full flex-col bg-sand-50 shadow-[var(--shadow-lift)]',
          'transition-transform duration-300 ease-[var(--ease-out-soft)]',
          side === 'right' ? 'right-0 max-w-md' : 'left-0 max-w-sm',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
          className,
        )}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}
