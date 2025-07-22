// backend/utils/helpers.js - Updated version with JioMart support
import fs from "fs";
import Deal from "../models/deal.js";
import { getSetting } from "./settings.js";

export function calculateDiscount(price, mrp) {
  if (!price || !mrp || mrp === 0) return 0;
  return Math.round(100 - (price / mrp) * 100);
}

export function cleanText(text) {
  return text?.replace(/[₹,]/g, "").trim() || "";
}

// Get current discount threshold from database
export async function getDiscountThreshold() {
  try {
    const threshold = await getSetting("DISCOUNT_THRESHOLD", 80);
    return parseInt(threshold);
  } catch (error) {
    console.error("Error getting discount threshold:", error);
    return 80; // fallback
  }
}

// Get headless setting from database
export async function getHeadlessSetting() {
  try {
    const headless = await getSetting("HEADLESS", true);
    return headless;
  } catch (error) {
    console.error("Error getting headless setting:", error);
    return true; // fallback
  }
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
  const jiomartBase = "https://www.jiomart.com/search/";

  return types.flatMap((type) => {
    const encodedTypeAmazon = encodeURIComponent(type); // For Amazon & Flipkart
    const encodedTypeJiomart = type.replace(/\s+/g, "%20"); // For JioMart URL encoding

    return [
      { url: `${amazonBase}${encodedTypeAmazon}`, type, platform: "amazon" },
      {
        url: `${flipkartBase}${encodedTypeAmazon}`,
        type,
        platform: "flipkart",
      },
      { url: `${jiomartBase}${encodedTypeJiomart}`, type, platform: "jiomart" },
    ];
  });
}

// ✅ ADD THIS NEW ASYNC HELPER
export async function getScrapingUrls() {
  try {
    const productTypes = await getSetting("PRODUCT_TYPES", []); // Fetch types from DB
    return generateUrls(productTypes); // Generate URLs on-the-fly
  } catch (error) {
    console.error("❌ Failed to get scraping URLs:", error);
    return []; // Return empty array on error
  }
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
