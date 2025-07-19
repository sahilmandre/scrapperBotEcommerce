export const formatPrice = (price) => {
  if (!price) return "₹0";
  return typeof price === "string" ? price : `₹${price.toLocaleString()}`;
};
