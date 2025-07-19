// utils/helpers.js
import fs from "fs";
import Deal from "../models/deal.js";

export function calculateDiscount(price, mrp) {
  if (!price || !mrp || mrp === 0) return 0;
  return Math.round(100 - (price / mrp) * 100);
}

export function cleanText(text) {
  return text?.replace(/[₹,]/g, "").trim() || "";
}

export function saveDealsToPlatformFile(platform, newDeals) {
  const filePath = `results/${platform}deals.json`;
  let existingDeals = [];

  if (fs.existsSync(filePath)) {
    const rawData = fs.readFileSync(filePath, "utf-8");
    try {
      existingDeals = JSON.parse(rawData);
    } catch {
      console.warn(`⚠️ Invalid JSON in ${filePath}, resetting...`);
    }
  }

  const combined = [...existingDeals, ...newDeals];
  const unique = Array.from(
    new Map(combined.map((d) => [`${d.title}-${d.price}`, d])).values()
  );

  fs.writeFileSync(filePath, JSON.stringify(unique, null, 2), "utf-8");
  return unique.length;
}

export function generateUrls(types) {
  const amazonBase = "https://www.amazon.in/s?k=";
  const flipkartBase = "https://www.flipkart.com/search?q=";

  return types.flatMap((type) => [
    { url: `${amazonBase}${type}`, type, platform: "amazon" },
    { url: `${flipkartBase}${type}`, type, platform: "flipkart" },
  ]);
}

// Save array of deals to MongoDB (bulk insert)
export async function saveDealsToMongo(deals) {
  try {
    if (!Array.isArray(deals) || deals.length === 0) return;

    // Remove existing deals of same platform + type to avoid duplicates
    const uniqueKeys = [
      ...new Set(deals.map((d) => `${d.platform}-${d.type}`)),
    ];
    for (const key of uniqueKeys) {
      const [platform, type] = key.split("-");
      await Deal.deleteMany({ platform, type });
    }

    await Deal.insertMany(deals);
    console.log(`✅ ${deals.length} deals saved to MongoDB.`);
  } catch (err) {
    console.error("❌ Error saving to MongoDB:", err.message);
  }
}