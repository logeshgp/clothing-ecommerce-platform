/**
 * Owner notification over WhatsApp.
 *
 * With no backend we use WhatsApp's public Click-to-Chat endpoint: we build a
 * pre-filled message and open `wa.me/<number>?text=…` in a new tab. The browser
 * (or the WhatsApp app on mobile) then sends it.
 *
 * Both the on/off flag and the destination number are admin-editable and live
 * in store settings under `settings.whatsapp`.
 */

/** Strips spaces, dashes and a leading "+" — wa.me wants digits only, country code included. */
export function normalizeWhatsAppNumber(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

export function isValidWhatsAppNumber(value) {
  const digits = normalizeWhatsAppNumber(value);
  return digits.length >= 10 && digits.length <= 15;
}

export function getWhatsAppContacts(settings) {
  const config = settings?.whatsapp;
  if (!config?.enabled) return [];

  const contacts = (Array.isArray(config.contacts) ? config.contacts : [])
    .filter((contact) => contact.enabled !== false && isValidWhatsAppNumber(contact.number));
  if (contacts.length) return contacts;
  if (isValidWhatsAppNumber(config.number)) {
    return [{ id: 'owner', label: config.ownerName || 'Store owner', number: config.number }];
  }
  return [];
}

/** Builds the full click-to-chat URL without opening it — handy for tests and fallbacks. */
export function buildWhatsAppUrl(number, message) {
  return `https://wa.me/${normalizeWhatsAppNumber(number)}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppMessage(number, message) {
  const anchor = document.createElement('a');
  anchor.href = buildWhatsAppUrl(number, message);
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.click();
}
