import { useState } from 'react';
import { MEASUREMENT_COLUMNS } from '../../data/taxonomy';
import { Modal } from '../ui/Modal';
import { RulerIcon } from '../ui/Icons';

const FIT_GUIDANCE = {
  slim: 'Cut close to the body. Size up if you prefer room to move.',
  regular: 'Our standard fit — true to size for most people.',
  relaxed: 'Generous through the body and leg. Size down for a closer fit.',
  oversized: 'Intentionally large with dropped shoulders. Consider sizing down.',
};

/** Measurement table + fit guidance. Measurements are flat, in inches. */
export function SizeGuide({ product }) {
  const [open, setOpen] = useState(false);

  if (!product.measurements) return null;

  const columns = MEASUREMENT_COLUMNS[product.category] ?? [
    { key: 'chest', label: 'Chest' },
    { key: 'waist', label: 'Waist' },
    { key: 'length', label: 'Length' },
  ];
  const rows = Object.entries(product.measurements);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 underline underline-offset-4 transition-colors hover:text-ink-900"
      >
        <RulerIcon className="h-4 w-4" />
        Size guide
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`${product.name} — size guide`}>
        <div className="space-y-6 p-6">
          <div className="rounded-2xl bg-sand-100 p-4">
            <p className="dnd-eyebrow mb-1">{product.fit} fit</p>
            <p className="text-sm text-ink-700">{FIT_GUIDANCE[product.fit]}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse text-sm">
              <caption className="sr-only">Garment measurements in inches, measured flat</caption>
              <thead>
                <tr className="border-b border-sand-300 text-left">
                  <th scope="col" className="py-3 pr-4 font-semibold">Size</th>
                  {columns.map((column) => (
                    <th key={column.key} scope="col" className="py-3 pr-4 font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([size, m]) => (
                  <tr key={size} className="border-b border-sand-200 last:border-0">
                    <th scope="row" className="py-3 pr-4 text-left font-medium">{size}</th>
                    {columns.map((column) => (
                      <td key={column.key} className="py-3 pr-4 tabular-nums text-ink-700">
                        {m?.[column.key]}"
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 text-xs text-ink-500">
            <p>All measurements are taken flat, in inches, and may vary by up to ½".</p>
            <p>Between sizes? For {product.fabric.toLowerCase()} we recommend sizing up.</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
