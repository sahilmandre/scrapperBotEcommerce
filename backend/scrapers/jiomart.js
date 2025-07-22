// scrapers/jiomart.js - FINAL VERSION
import axios from "axios";
import chalk from "chalk";
import dotenv from "dotenv";
import {
  calculateDiscount,
  saveDealsToMongo,
  getDiscountThreshold,
} from "../utils/helpers.js";
import { urls } from "../config/urls.js";

dotenv.config();

// Algolia API constants
const ALGOLIA_APP_ID = "3YP0HP3WSH";
const ALGOLIA_API_KEY = "aace3f18430a49e185d2c1111602e4b1";
const ALGOLIA_INDEX_NAME = "prod_mart_master_vertical";

export async function scrapeJiomart() {
  const threshold = await getDiscountThreshold();
  console.log(chalk.blue(`🎯 Using discount threshold: ${threshold}%`));

  const allProducts = [];

  for (const { url, type, platform } of urls.filter(
    (u) => u.platform === "jiomart"
  )) {
    try {
      const searchQuery = new URL(url).pathname.split("/search/")[1];
      if (!searchQuery) {
        console.log(chalk.yellow(`⚠️ No search query found in URL: ${url}`));
        continue;
      }

      console.log(chalk.blue(`🔍 Scraping [${type}]: ${searchQuery}`));

      const genericFilters = `(mart_availability:JIO OR mart_availability:JIO_WA) AND (available_stores:PANINDIABOOKS OR available_stores:PANINDIACRAFT OR available_stores:PANINDIADIGITAL OR available_stores:PANINDIAFASHION OR available_stores:PANINDIAFURNITURE OR available_stores:T12D OR available_stores:PANINDIAGROCERIES OR available_stores:PANINDIAHOMEANDKITCHEN OR available_stores:PANINDIAHOMEIMPROVEMENT OR available_stores:PANINDIAJEWEL OR available_stores:PANINDIALOCALSHOPS OR available_stores:PANINDIASTL OR available_stores:PANINDIAWELLNESS) AND (NOT vertical_code:ALCOHOL) AND (NOT vertical_code:LOCALSHOPS)`;

      const response = await axios.post(
        `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`,
        {
          requests: [
            {
              indexName: ALGOLIA_INDEX_NAME,
              // FINAL FIX: The 'params' value must be a URL-encoded string.
              params: new URLSearchParams({
                query: decodeURIComponent(searchQuery),
                hitsPerPage: "50", // Use string for consistency in URL params
                facets: JSON.stringify(["*"]),
                facetFilters: JSON.stringify([
                  ["category_tree.level0:Category"],
                ]),
                filters: genericFilters,
              }).toString(),
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Algolia-Application-Id": ALGOLIA_APP_ID,
            "X-Algolia-API-Key": ALGOLIA_API_KEY,
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        }
      );

      const products = response.data.results[0].hits
        .map((hit) => {
          const sellerData =
            hit.buybox_mrp?.PANINDIAFASHION ||
            hit.buybox_mrp?.PANINDIAGROCERIES ||
            hit.buybox_mrp?.PANINDIAHOMEANDKITCHEN ||
            (hit.seller_wise_mrp &&
              Object.values(hit.seller_wise_mrp)[0]?.[
                Object.keys(Object.values(hit.seller_wise_mrp)[0])[0]
              ]) ||
            null;

          if (!sellerData) return null;

          const price = sellerData.price || 0;
          const mrp = sellerData.mrp || price;
          const discount = calculateDiscount(price, mrp);

          return {
            platform,
            type,
            title: hit.display_name,
            price: `₹${price}`,
            mrp: `₹${mrp}`,
            link: `https://www.jiomart.com${hit.url_path}`,
            discount,
            image: `https://www.jiomart.com/images/product/original/${hit.image_path}`,
            scrapedAt: new Date(),
          };
        })
        .filter((product) => product && product.discount >= threshold);

      console.log(
        `✅ Found ${products.length} valid deals for: ${searchQuery}`
      );
      allProducts.push(...products);
    } catch (err) {
      console.error(`❌ JioMart API scrape failed for ${url} -`, err.message);
      if (err.response) {
        console.error("API Error:", err.response.data);
      }
    }
  }

  if (allProducts.length > 0) {
    await saveDealsToMongo(allProducts);
  }

  return allProducts;
}
