// backend/scrapers/jiomart.js
import axios from "axios";
import chalk from "chalk";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import Product from "../models/product.js";
import {
  calculateDiscount,
  cleanText,
  getDiscountThreshold,
  getHeadlessSetting,
  getScrapingUrls,
  extractProductId,
} from "../utils/helpers.js";

dotenv.config();

// Use environment variables for API keys
const ALGOLIA_APP_ID = process.env.JIOMART_ALGOLIA_APP_ID || "3YP0HP3WSH";
const ALGOLIA_API_KEY =
  process.env.JIOMART_ALGOLIA_API_KEY || "aace3f18430a49e185d2c1111602e4b1";
const ALGOLIA_INDEX_NAME = "prod_mart_master_vertical";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Uses Puppeteer to launch a browser, set the delivery pincode on JioMart,
 * and extracts the resulting cookies for use in API calls.
 * @param {string} pincode The pincode to set.
 * @param {boolean} headless Whether to run the browser in headless mode.
 * @returns {Promise<string>} A string of cookies to be used in subsequent requests.
 */
async function getJioMartCookiesWithBrowser(pincode, headless) {
  console.log(
    chalk.yellow(
      "🔧 JioMart: Launching browser to set pincode and get cookies..."
    )
  );
  const browser = await puppeteer.launch({
    headless,
    args: ["--disable-notifications", "--deny-permission-prompts"],
  });
  const page = await browser.newPage();
  try {
    await page.goto("https://www.jiomart.com", { waitUntil: "networkidle2" });

    // ✅ DEFINITIVE FIX: Handle popups and wait for the correct pincode modal
    try {
      // First, try to close the "Enable Location Services" popup if it appears
      await page.waitForSelector("#btn_location_close_icon", {
        timeout: 10000,
      });
      await page.click("#btn_location_close_icon");
      console.log(chalk.gray("Closed the 'Enable Location' popup."));
    } catch (e) {
      console.log(chalk.gray("Location popup did not appear, proceeding..."));
    }

    // After the first popup is gone, the main pincode modal should appear.
    // We no longer click the header link. We wait directly for the pincode input.
    console.log(chalk.gray("Waiting for pincode modal to appear..."));
    await page.waitForSelector("#rel_pincode", {
      visible: true,
      timeout: 15000,
    });

    // Enter the pincode and apply
    await page.type("#rel_pincode", pincode);
    await page.click("#btn_pincode_submit");

    // Wait for the modal to disappear as confirmation
    await page.waitForFunction(() => !document.querySelector("#rel_pincode"), {
      timeout: 10000,
    });
    console.log(chalk.green(`✅ JioMart: Pincode ${pincode} applied.`));
    await delay(1000); // Small delay for cookies to settle

    const cookies = await page.cookies();
    console.log(chalk.green("✅ JioMart: Cookies retrieved successfully."));
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch (error) {
    console.error(
      chalk.red("❌ Failed to get JioMart cookies using browser:"),
      error.message
    );
    throw error;
  } finally {
    await browser.close();
  }
}

export async function scrapeJiomart(pincode) {
  const threshold = await getDiscountThreshold();
  const headless = await getHeadlessSetting();
  const urls = await getScrapingUrls();
  console.log(
    chalk.blue(`🎯 JioMart: Using discount threshold: ${threshold}%`)
  );
  console.log(chalk.blue(`🎯 JioMart: Using pincode: ${pincode}`));

  const updatedProducts = [];

  try {
    const cookieHeader = await getJioMartCookiesWithBrowser(pincode, headless);

    for (const { url, type } of urls.filter((u) => u.platform === "jiomart")) {
      try {
        const searchQuery = new URL(url).pathname.split("/search/")[1];
        if (!searchQuery) continue;

        console.log(
          chalk.blue(`🔍 Scraping JioMart [${type}] via API: ${searchQuery}`)
        );

        const response = await axios.post(
          `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`,
          {
            requests: [
              {
                indexName: ALGOLIA_INDEX_NAME,
                params: `query=${decodeURIComponent(
                  searchQuery
                )}&hitsPerPage=50&facets=["*"]&facetFilters=[["category_tree.level0:Category"]]`,
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Algolia-Application-Id": ALGOLIA_APP_ID,
              "X-Algolia-API-Key": ALGOLIA_API_KEY,
              Cookie: cookieHeader,
            },
          }
        );

        const hits = response.data.results[0]?.hits || [];
        console.log(
          chalk.gray(
            `🧪 Found ${hits.length} product entries from JioMart API.`
          )
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
            if (!productId) continue;

            const priceText = `₹${price}`;
            const mrpText = `₹${mrp}`;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const product = await Product.findOne({
              productId: productId,
              "priceHistory.scrapedAt": { $gte: today },
            });

            if (product) {
              const todaysEntry = product.priceHistory.find(
                (h) => new Date(h.scrapedAt) >= today
              );
              const existingPrice = parseFloat(cleanText(todaysEntry.price));

              if (price < existingPrice) {
                await Product.updateOne(
                  { "priceHistory._id": todaysEntry._id },
                  {
                    $set: {
                      "priceHistory.$.price": priceText,
                      "priceHistory.$.mrp": mrpText,
                      "priceHistory.$.discount": discount,
                    },
                  }
                );
                console.log(
                  chalk.magenta(
                    `🔄 Updated to new LOWEST price for: ${hit.display_name}`
                  )
                );
              } else {
                console.log(
                  chalk.gray(
                    `👍 Kept existing lower price for: ${hit.display_name}`
                  )
                );
              }
            } else {
              const newPriceEntry = {
                price: priceText,
                mrp: mrpText,
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
                  $setOnInsert: { type: type },
                  $push: {
                    priceHistory: { $each: [newPriceEntry], $slice: -90 },
                  },
                },
                { upsert: true, new: true }
              );
              console.log(
                chalk.green(
                  `✅ Added new deal for: ${updatedProduct.title.substring(
                    0,
                    40
                  )}... | ${discount}% off`
                )
              );
              updatedProducts.push(updatedProduct);
            }
          }
        }
      } catch (err) {
        console.error(`❌ JioMart API scrape failed for ${url} -`, err.message);
      }
    }
  } catch (err) {
    console.error(`❌ Failed to complete JioMart scrape -`, err.message);
  }

  return updatedProducts;
}
