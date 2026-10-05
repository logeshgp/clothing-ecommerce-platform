import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { classNames } from '../../utils/format';
import { CloseIcon } from '../ui/Icons';

const SESSION_KEY = 'dnd.banner.dismissed';

/**
 * Promotional banner popup, configured entirely from the admin console:
 * title, body, image, call to action, theme, delay and whether it should
 * reappear after being dismissed.
 */
export function BannerPopup() {
  const { settings, assetUrl } = useStore();
  const banner = settings.banner ?? {};
  const visible = settings.visibility?.promotionalBanner !== false;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!visible || !banner.enabled || !banner.title) return undefined;

    const key = `${SESSION_KEY}.${banner.title}`;
    if (banner.showOncePerSession && sessionStorage.getItem(key)) return undefined;

    const timer = setTimeout(() => setOpen(true), Number(banner.delayMs) || 1200);
    return () => clearTimeout(timer);
  }, [visible, banner.enabled, banner.title, banner.delayMs, banner.showOncePerSession]);

  function dismiss() {
    setOpen(false);
    if (banner.showOncePerSession) {
      sessionStorage.setItem(`${SESSION_KEY}.${banner.title}`, '1');
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && dismiss();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);

  }, [open]);

  if (!open) return null;

  const dark = banner.theme !== 'light';

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close promotion"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-ink-900/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={banner.title}
        className={classNames(
          'relative z-10 w-full max-w-lg animate-fade-up overflow-hidden rounded-3xl shadow-[var(--shadow-lift)]',
          dark ? 'bg-ink-900 text-sand-100' : 'bg-sand-50 text-ink-900',
        )}
      >
        {banner.image && (
          <div className="aspect-[16/9] w-full bg-sand-200">
            <img src={assetUrl(banner.image)} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="space-y-4 p-8">
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{banner.title}</h2>
          {banner.body && (
            <p className={classNames('text-sm leading-relaxed', dark ? 'text-sand-300' : 'text-ink-500')}>
              {banner.body}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {banner.ctaLabel && (
              <Link
                to={banner.ctaTo || '/shop'}
                onClick={dismiss}
                className={classNames(
                  'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-transform active:scale-95',
                  dark ? 'bg-sand-50 text-ink-900' : 'bg-ink-900 text-sand-100',
                )}
              >
                {banner.ctaLabel}
              </Link>
            )}
            {banner.dismissible !== false && (
              <button
                type="button"
                onClick={dismiss}
                className={classNames(
                  'text-sm underline underline-offset-4',
                  dark ? 'text-sand-400' : 'text-ink-500',
                )}
              >
                No thanks
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className={classNames(
            'absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-colors',
            dark ? 'bg-ink-900/60 text-sand-100 hover:bg-ink-900' : 'bg-sand-50/80 hover:bg-white',
          )}
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
