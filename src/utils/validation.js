/** Lightweight client-side validators used by the checkout, auth and address forms. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;
const ZIP_RE = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/;

export function isEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

export function isPhone(value) {
  return PHONE_RE.test(String(value || '').trim());
}

export function isPostalCode(value) {
  return ZIP_RE.test(String(value || '').trim());
}

export function isRequired(value) {
  return String(value ?? '').trim().length > 0;
}

export function isStrongEnoughPassword(value) {
  return String(value || '').length >= 8;
}

/**
 * Runs a map of `{ field: [value, validatorFn, message] }` and returns `{ field: message }`
 * for every entry that failed. An empty object means the form is valid.
 */
export function validateFields(rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, [value, validator, message]]) => {
    if (!validator(value)) errors[field] = message;
  });
  return errors;
}
