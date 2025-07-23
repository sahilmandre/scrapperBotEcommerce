import axios from "axios";
import chalk from "chalk";
import dotenv from "dotenv";
import Product from "../models/product.js"; // ✅ Import the new Product model
import {
  calculateDiscount,
  getDiscountThreshold,
  getScrapingUrls,
  extractProductId, // ✅ Import our new ID extractor
} from "../utils/helpers.js";

dotenv.config();

const ALGOLIA_APP_ID = "3YP0HP3WSH";
const ALGOLIA_API_KEY = "aace3f18430a49e185d2c1111602e4b1";
const ALGOLIA_INDEX_NAME = "prod_mart_master_vertical";

export async function scrapeJiomart() {
  const threshold = await getDiscountThreshold();
  const urls = await getScrapingUrls();
  console.log(
    chalk.blue(`🎯 JioMart: Using discount threshold: ${threshold}%`)
  );

  const updatedProducts = [];

  for (const { url, type } of urls.filter((u) => u.platform === "jiomart")) {
    try {
      const searchQuery = new URL(url).pathname.split("/search/")[1];
      if (!searchQuery) continue;

      console.log(chalk.blue(`🔍 Scraping JioMart [${type}]: ${searchQuery}`));

      const genericFilters = `(mart_availability:JIO OR mart_availability:JIO_WA) AND (available_stores:PANINDIABOOKS OR available_stores:PANINDIACRAFT OR available_stores:PANINDIADIGITAL OR available_stores:PANINDIAFASHION OR available_stores:PANINDIAFURNITURE OR available_stores:T12D OR available_stores:PANINDIAGROCERIES OR available_stores:PANINDIAHOMEANDKITCHEN OR available_stores:PANINDIAHOMEIMPROVEMENT OR available_stores:PANINDIAJEWEL OR available_stores:PANINDIALOCALSHOPS OR available_stores:PANINDIASTL OR available_stores:PANINDIAWELLNESS) AND (NOT vertical_code:ALCOHOL) AND (NOT vertical_code:LOCALSHOPS)`;

      const response = await axios.post(
        `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`,
        {
          requests: [
            {
              indexName: ALGOLIA_INDEX_NAME,
              params: new URLSearchParams({
                query: decodeURIComponent(searchQuery),
                hitsPerPage: "50",
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
          },
        }
      );

      const hits = response.data.results[0]?.hits || [];
      console.log(
        chalk.gray(`🧪 Found ${hits.length} product entries from JioMart API.`)
      );

      for (const hit of hits) {
        const sellerData =
          hit.buybox_mrp?.PANINDIAFASHION ||
          hit.buybox_mrp?.PANINDIAGROCERIES ||
          hit.buybox_mrp?.PANINDIAHOMEANDKITCHEN ||
          (hit.seller_wise_mrp &&
            Object.values(hit.seller_wise_mrp)[0]?.[
              Object.keys(Object.values(hit.seller_wise_mrp)[0])[0]
            ]) ||
          null;
        if (!sellerData) continue;

        const price = sellerData.price || 0;
        const mrp = sellerData.mrp || price;
        const discount = calculateDiscount(price, mrp);

        if (discount >= threshold) {
          const link = `https://www.jiomart.com${hit.url_path}`;
          const productId = extractProductId(link, "jiomart");
          if (!productId) {
            console.log(
              chalk.yellow(
                `⚠️ Could not extract Product ID for: ${hit.display_name}`
              )
            );
            continue;
          }

          const newPriceEntry = {
            price: `₹${price}`,
            mrp: `₹${mrp}`,
            discount,
            scrapedAt: new Date(),
          };

          const updatedProduct = await Product.findOneAndUpdate(
            { productId: productId },
            {
              $set: {
                title: hit.display_name,
                image: `https://www.jiomart.com/images/product/original/${hit.image_path}`,
                link: link,
                platform: "jiomart",
              },
              $push: {
                priceHistory: {
                  $each: [newPriceEntry],
                  $slice: -90,
                },
              },
            },
            { upsert: true, new: true }
          );

          console.log(
            chalk.green(`✅ Updated/Added JioMart: ${updatedProduct.title}`)
          );
          updatedProducts.push(updatedProduct);
        }
      }
    } catch (err) {
      console.error(`❌ JioMart API scrape failed for ${url} -`, err.message);
    }
  }

  return updatedProducts;
}
