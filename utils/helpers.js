// utils/helpers.js
export function calculateDiscount(price, mrp) {
  if (!price || !mrp || mrp === 0) return 0;
  return Math.round(100 - (price / mrp) * 100);
}

export function cleanText(text) {
  return text?.replace(/[₹,]/g, '').trim() || '';
}
