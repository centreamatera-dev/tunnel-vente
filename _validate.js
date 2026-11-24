export const CONSENT_TEXT =
  "En cliquant sur le bouton, vous acceptez d'être contactée par le Centre Amatera au sujet de votre bilan peau.";

export const CHOICES = {
  priority: ['laser', 'visage', 'les-deux'],
  contraindication: ['non', 'oui', 'ne-sais-pas'],
  experience: ['jamais', 'laser', 'soin-visage', 'les-deux'],
  source: ['google', 'instagram', 'bouche-a-oreille', 'flyer', 'autre'],
};

export function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// Mobile français (06 ou 07), renvoyé au format +33XXXXXXXXX. Sinon null.
export function normalizePhone(raw) {
  const compact = String(raw ?? '').replace(/[\s.\-()]/g, '');
  const match = compact.match(/^(?:\+33|0033|0)([67]\d{8})$/);
  return match ? `+33${match[1]}` : null;
}

export function isEmail(value) {
  return value.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function readBody(req) {
  return req.body && typeof req.body === 'object' ? req.body : {};
}
