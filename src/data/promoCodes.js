/** Promotion codes seeded on first load and editable from the admin console. */

export const SEED_PROMOS = [];

export const PROMO_TYPES = [
  { value: 'percent', label: 'Percent off' },
  { value: 'fixed', label: 'Flat amount off' },
  { value: 'shipping', label: 'Free shipping' },
];

/**
 * Client-side preview of a promo code. The server re-validates and re-prices
 * at checkout, so this is purely for immediate feedback in the cart.
 *
 * @returns {{ok: true, promo: object} | {ok: false, reason: string}}
 */
export function resolvePromoCode(rawCode, subtotal, promos = []) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, reason: 'Enter a promo code.' };

  const promo = promos.find((p) => String(p.code).toUpperCase() === code);
  if (!promo) return { ok: false, reason: `"${code}" isn't a valid code.` };
  if (promo.active === false) return { ok: false, reason: `${promo.code} is no longer active.` };

  if (subtotal < (promo.minSubtotal ?? 0)) {
    return {
      ok: false,
      reason: `${promo.code} needs a subtotal of at least ₹${Number(
        promo.minSubtotal,
      ).toLocaleString('en-IN')}.`,
    };
  }

  return { ok: true, promo };
}
