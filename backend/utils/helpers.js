import { getSetting } from "./settings.js";

/**
 * Extracts a unique product ID from a URL based on the platform.
 * This version is more robust to handle different URL formats, including sponsored links.
 * @param {string} link - The product URL to parse.
 * @param {string} platform - The platform ('amazon', 'flipkart', 'jiomart').
 * @returns {string|null} A unique product ID like 'amzn-B0CLV1X4QJ' or null.
 */
export function extractProductId(link, platform) {
  try {
    const url = new URL(link);

    if (platform === "amazon") {
      // ✅ NEW PATTERN: Handle sponsored links first ('/sspa/click')
      if (url.pathname.startsWith("/sspa/click")) {
        const redirectUrl = url.searchParams.get("url");
        if (redirectUrl) {
          // Create a new URL object from the decoded redirect URL and re-run extraction
          const decodedUrl = new URL("https://www.amazon.in" + redirectUrl);
          const match = decodedUrl.pathname.match(/\/dp\/([A-Z0-9]{10})/);
          if (match && match[1]) {
            return `amzn-${match[1]}`;
          }
        }
      }

      // Pattern 1: Look for '/dp/ASIN' in the path. This is the most common format.
      let match = url.pathname.match(/\/dp\/([A-Z0-9]{10})/);
      if (match && match[1]) {
        return `amzn-${match[1]}`;
      }
      // Pattern 2: Fallback for URLs with '/gp/product/ASIN'.
      match = url.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/);
      if (match && match[1]) {
        return `amzn-${match[1]}`;
      }
    } else if (platform === "flipkart") {
      // Pattern 1: Look for the 'pid' in the query parameters. This is the most reliable.
      const pid = url.searchParams.get("pid");
      if (pid) {
        return `fk-${pid}`;
      }
      // Pattern 2: Fallback for URLs that might not have a 'pid' but have a similar structure.
      const pathMatch = url.pathname.match(
        /\/p\/[a-zA-Z0-9-]+\/([A-Z0-9]{16})/
      );
      if (pathMatch && pathMatch[1]) {
        return `fk-${pathMatch[1]}`;
      }
    } else if (platform === "jiomart") {
      // The ID is usually the last part of the path, often a long number.
      const pathParts = url.pathname.split("/");
      const potentialId = pathParts[pathParts.length - 1];
      if (potentialId && !isNaN(potentialId)) {
        // Check if it's a number
        return `jm-${potentialId}`;
      }
    }
  } catch (error) {
    console.error(`Failed to parse URL ${link}`, error);
    return null;
  }

  // If no pattern matches after trying everything, log a warning.
  console.warn(
    `⚠️ Could not determine Product ID for ${platform} link: ${link}`
  );
  return null;
}

// --- Other helper functions remain the same ---

export function calculateDiscount(price, mrp) {
  if (!price || !mrp || mrp === 0) return 0;
  return Math.round(100 - (price / mrp) * 100);
}

export function cleanText(text) {
  return text?.replace(/[₹,]/g, "").trim() || "";
}

export async function getDiscountThreshold() {
  try {
    const threshold = await getSetting("DISCOUNT_THRESHOLD", 80);
    return parseInt(threshold);
  } catch (error) {
    console.error("Error getting discount threshold:", error);
    return 80; // fallback
  }
}

export async function getHeadlessSetting() {
  try {
    const headless = await getSetting("HEADLESS", true);
    return headless;
  } catch (error) {
    console.error("Error getting headless setting:", error);
    return true; // fallback
  }
}

export async function getScrapingUrls() {
  try {
    const productTypes = await getSetting("PRODUCT_TYPES", []);
    return generateUrls(productTypes);
  } catch (error) {
    console.error("❌ Failed to get scraping URLs:", error);
    return [];
  }
}

export function generateUrls(types) {
  const amazonBase = "https://www.amazon.in/s?k=";
  const flipkartBase = "https://www.flipkart.com/search?q=";
  const jiomartBase = "https://www.jiomart.com/search/";

  return types.flatMap((type) => {
    const encodedType = encodeURIComponent(type);
    return [
      { url: `${amazonBase}${encodedType}`, type, platform: "amazon" },
      { url: `${flipkartBase}${encodedType}`, type, platform: "flipkart" },
      {
        url: `${jiomartBase}${type.replace(/\s+/g, "%20")}`,
        type,
        platform: "jiomart",
      },
    ];
  });
}
