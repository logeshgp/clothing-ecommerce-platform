import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { colorImage, colorNames, sizesInStock, stockFor } from '../../data/products';
import { CATEGORY_MAP } from '../../data/taxonomy';
import { formatPrice } from '../../utils/format';
import { assetUrl } from '../../api/client';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ColorSwatchButton } from '../ui/ColorSwatch';
import { QuantityStepper } from '../ui/QuantityStepper';
import { SizePicker } from './SizePicker';
import { ArrowUpRightIcon } from '../ui/Icons';

/** Add-to-bag without leaving the grid. */
export function QuickViewModal({ product, open, onClose }) {
  const { addItem, openCart } = useCart();
  const { notify } = useToast();

  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;
    setColor(colorNames(product)[0]);
    setSize(null);
    setQuantity(1);
  }, [product]);

  const stockBySize = useMemo(() => {
    if (!product || !color) return {};
    return Object.fromEntries(product.sizes.map((s) => [s, stockFor(product, color, s)]));
  }, [product, color]);

  if (!product || !color) return null;

  const available = sizesInStock(product, color);
  const maxQuantity = size ? Math.min(stockBySize[size] ?? 0, 10) : 10;
  const categoryName = CATEGORY_MAP[product.category]?.name ?? product.category;

  function handleAdd() {
    if (!size) {
      notify('Choose a size first.', { tone: 'error' });
      return;
    }
    addItem(product, { size, color, quantity, maxQuantity });
    notify(`${product.name} (${size}, ${color}) added to your bag.`, {
      tone: 'success',
      action: { label: 'View bag', onClick: openCart },
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} width="lg" title="Quick view">
      <div className="grid gap-8 p-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-sand-200">
          <img
            src={assetUrl(colorImage(product, color))}
            alt={`${product.name} in ${color}`}
            className="aspect-[4/5] w-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <p className="dnd-eyebrow">{categoryName}</p>
            <h3 className="text-2xl font-semibold">{product.name}</h3>
            <p className="flex items-baseline gap-2 text-lg font-semibold">
              {formatPrice(product.price)}
              {product.compareAt && (
                <s className="text-sm font-normal text-ink-500">{formatPrice(product.compareAt)}</s>
              )}
            </p>
            <p className="text-sm leading-relaxed text-ink-500">{product.blurb}</p>
          </div>

          <div className="space-y-2">
            <p className="dnd-label mb-0">Colour — {color}</p>
            <div className="flex flex-wrap gap-2">
              {colorNames(product).map((option) => (
                <ColorSwatchButton
                  key={option}
                  color={option}
                  selected={option === color}
                  onSelect={(next) => {
                    setColor(next);
                    setSize(null);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="dnd-label mb-0">Size</p>
            <SizePicker
              sizes={product.sizes}
              value={size}
              onChange={setSize}
              stockBySize={stockBySize}
              size="sm"
            />
            {size && stockBySize[size] <= 3 && stockBySize[size] > 0 && (
              <p className="text-xs font-medium text-berry-500">
                Only {stockBySize[size]} left in {size}.
              </p>
            )}
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-3">
              <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} size="sm" />
              <Button onClick={handleAdd} disabled={!available.length} className="flex-1">
                {available.length ? 'Add to bag' : 'Sold out'}
              </Button>
            </div>
            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
            >
              View full details <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
