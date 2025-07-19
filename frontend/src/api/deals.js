const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchDeals = async (type, minDiscount) => {
  const query = new URLSearchParams();
  if (type) query.append("type", type);
  if (minDiscount) query.append("minDiscount", minDiscount);

  const fullUrl = `${BASE_URL}/api/deals?${query.toString()}`;
  console.log("➡️ Fetching deals from:", fullUrl); // Add this debug line

  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error("Failed to fetch deals");
  return res.json();
};
