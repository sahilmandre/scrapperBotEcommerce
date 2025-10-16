// backend/scrapers/swiggyInstamartScraper.js
import chalk from "chalk";
import puppeteer from "puppeteer";
import axios from "axios";
import Product from "../models/product.js";
import {
  getHeadlessSetting,
  getDiscountThreshold,
  calculateDiscount,
  cleanText,
} from "../utils/helpers.js";
import { getSetting } from "../utils/settings.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- SELECTORS FOR SWIGGY INSTAMART ---
const SELECTORS = {
  // Using a more stable data-testid for the location button
  shareLocationButton: '[data-testid="set-gps-button"]',
  searchIcon: 'a[href="/instamart/search"]',
  // ... rest of the selectors for API scraping remain the same
};


/**
 * Uses Puppeteer to set a location on Swiggy by granting geolocation permissions
 * and clicking the "Share location" button to retrieve necessary cookies.
 * @param {boolean} headless - Whether to run the browser in headless mode.
 * @returns {Promise<string>} A string of cookies required for API calls.
 */
async function getInstamartCookies(headless) {
  console.log(chalk.yellow("🔧 Launching browser to fetch session cookies..."));
  const browser = await puppeteer.launch({ headless, args: ["--no-sandbox"] });
  try {
    const latitude = await getSetting("ZEPTO_LATITUDE", 22.7196);
    const longitude = await getSetting("ZEPTO_LONGITUDE", 75.8577);
    const swiggyOrigin = "https://www.swiggy.com";

    const context = browser.defaultBrowserContext();
    await context.overridePermissions(swiggyOrigin, ["geolocation"]);
    
    const page = await browser.newPage();
    await page.setGeolocation({ latitude, longitude });

    await page.goto(`${swiggyOrigin}/instamart`, { waitUntil: "networkidle2" });

    console.log(chalk.gray("Waiting for 'Share Location' button in modal..."));
    await page.waitForSelector(SELECTORS.shareLocationButton, { visible: true, timeout: 20000 });
    await page.click(SELECTORS.shareLocationButton);
    
    console.log(chalk.gray("Clicked 'Share Location'. Waiting for page to confirm location..."));
    await page.waitForSelector(SELECTORS.searchIcon, { visible: true, timeout: 20000 });
    console.log(chalk.green("✅ Location set. Retrieving cookies."));

    const cookies = await page.cookies();
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } finally {
    if (browser) await browser.close();
    console.log(chalk.gray("Browser closed. Proceeding with API calls."));
  }
}

export async function scrapeInstamart() {
  const headless = await getHeadlessSetting();
  const productTypes = await getSetting("PRODUCT_TYPES", []);
  const threshold = await getDiscountThreshold();
  const updatedProducts = [];

  console.log(chalk.cyan("🚀 Starting Swiggy Instamart Scraper..."));
  
  try {
    const cookieHeader = await getInstamartCookies(headless);
    const lat = await getSetting("ZEPTO_LATITUDE");
    const lng = await getSetting("ZEPTO_LONGITUDE");

    for (const type of productTypes) {
      console.log(chalk.yellow(`\n🔍 Searching for category via API: "${type}"`));
      
      try {
        const response = await axios.post(
          `https://www.swiggy.com/api/instamart/search/v2?offset=0`,
          {
            query: type,
            page_type: "INSTAMART_SEARCH_PAGE",
            is_pre_search_tag: false,
            search_results_offset: "0",
            sortAttribute: "",
            facets: [],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "*/*",
              Origin: "https://www.swiggy.com",
              Referer: `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(type)}`,
              Cookie: cookieHeader,
              lat: lat.toString(),
              lng: lng.toString(),
            },
          }
        );

        const items = response.data?.data?.items || [];
        console.log(chalk.gray(`Found ${items.length} products for "${type}".`));

        for (const item of items) {
          const variation = item.variations[0];
          if (!variation) continue;

          const priceInfo = variation.price;
          // Ensure price info exists
          if (!priceInfo || typeof priceInfo.offer_price === 'undefined' || typeof priceInfo.mrp === 'undefined') {
            continue;
          }

          const price = priceInfo.offer_price;
          const mrp = priceInfo.mrp;
          const discount = calculateDiscount(price, mrp);

          if (discount >= threshold) {
            const productId = `swiggy-${item.item_id}-${variation.variant_id}`; // More specific ID
            const productUrl = `https://www.swiggy.com/instamart/item/${item.item_id}`;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const product = await Product.findOne({
              productId: productId,
              "priceHistory.scrapedAt": { $gte: today },
            });

            if (!product) {
               const newPriceEntry = {
                price: `₹${price}`,
                mrp: `₹${mrp}`,
                discount,
                scrapedAt: new Date(),
              };

              const updatedProduct = await Product.findOneAndUpdate(
                { productId },
                {
                  $set: {
                    title: item.display_name,
                    image: `https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_200,w_200/${item.images[0]}`,
                    link: productUrl,
                    platform: "instamart",
                    type: type,
                  },
                  $push: {
                    priceHistory: { $each: [newPriceEntry], $slice: -90 },
                  },
                },
                { upsert: true, new: true }
              );

              console.log(chalk.green(`✅ Saved new deal: ${updatedProduct.title.substring(0, 40)}... | ${discount}% off`));
              updatedProducts.push(updatedProduct);
            }
          }
        }
      } catch (apiError) {
         console.error(chalk.red(`❌ API call for "${type}" failed: ${apiError.message}`));
      }
      await delay(1000); // Add a small delay between API calls
    }
  } catch (err) {
    console.error(chalk.red("❌ Swiggy Instamart Scrape failed -"), err.message);
  }

  console.log(chalk.cyan("🚀 Closing Swiggy Instamart Scraper."));
  return updatedProducts;
}

