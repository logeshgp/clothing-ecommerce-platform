import { useState } from 'react';
import { colorNames } from '../../data/products';
import { assetUrl } from '../../api/client';
import { classNames } from '../../utils/format';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icons';

/**
 * PDP gallery. Images are per-colourway, so selecting a colour upstream moves
 * the gallery to the matching shot.
 */
export function ProductGallery({ product, activeColor, onColorChange }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const colors = colorNames(product);
  const index = Math.max(0, colors.indexOf(activeColor));
  const current = product.colors[index] ?? product.colors[0];

  function step(direction) {
    const next = (index + direction + colors.length) % colors.length;
    onColorChange(colors[next]);
  }

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {product.colors.length > 1 && (
        <div className="flex gap-3 lg:flex-col" role="tablist" aria-label="Product images">
          {product.colors.map((color, i) => (
            <button
              key={color.name}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${product.name} in ${color.name}`}
              onClick={() => onColorChange(color.name)}
              className={classNames(
                'h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 lg:h-24 lg:w-20',
                i === index ? 'border-ink-900' : 'border-transparent opacity-65 hover:opacity-100',
              )}
            >
              <img src={assetUrl(color.image)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div
        className="group relative flex-1 overflow-hidden rounded-3xl bg-sand-200"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="aspect-[4/5]">
          <img
            src={assetUrl(current?.image)}
            alt={`${product.name} in ${current?.name}`}
            className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)]"
            style={{
              transform: zoomed ? 'scale(1.6)' : 'scale(1)',
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
          />
        </div>

        {product.colors.length > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => step(-1)} />
            <GalleryArrow side="right" onClick={() => step(1)} />
          </>
        )}

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-sand-50/90 px-3 py-1.5 text-[11px] font-medium backdrop-blur">
          {index + 1} / {product.colors.length} · {current?.name}
        </div>
      </div>
    </div>
  );
}

function GalleryArrow({ side, onClick }) {
  const Icon = side === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      className={classNames(
        'absolute top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full',
        'bg-sand-50/90 opacity-0 backdrop-blur transition-opacity duration-200',
        'group-hover:opacity-100 focus-visible:opacity-100',
        side === 'left' ? 'left-4' : 'right-4',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
