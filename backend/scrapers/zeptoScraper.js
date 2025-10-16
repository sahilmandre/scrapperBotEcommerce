// backend/scrapers/zeptoScraper.js
import chalk from "chalk";
import puppeteer from "puppeteer";
import Product from "../models/product.js";
import {
  getHeadlessSetting,
  getDiscountThreshold,
  calculateDiscount,
  cleanText,
  extractProductId,
} from "../utils/helpers.js";
import { getSetting } from "../utils/settings.js";

// --- SELECTORS FOR ZEPTO ---
const SELECTORS = {
  locationButton: 'button[aria-label="Select Location"]',
  enableLocationButton: "button.cpG2SV.cVzWKq.cimLEg",
  locationConfirmation: '[data-testid="search-bar-icon"]',
  productCard: '[data-testid="product-card-wrapper"]',
  // Selectors for scraping (will be used in the next step)
  productTitle: '[data-testid="product-card-wrapper"] h4',
  productImage: '[data-testid="product-card-wrapper"] img',
  productPrice: '[data-testid="price-wrapper"]',
  productMrp: '[data-testid="price-wrapper"] .gMWGMV',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function scrapeZepto() {
  const headless = await getHeadlessSetting();
  const latitude = await getSetting("ZEPTO_LATITUDE", 22.7196);
  const longitude = await getSetting("ZEPTO_LONGITUDE", 75.8577);
  const productTypes = await getSetting("PRODUCT_TYPES", []);
  const threshold = await getDiscountThreshold();
  const updatedProducts = [];

  console.log(chalk.cyan("🚀 Starting Zepto Scraper..."));
  console.log(chalk.blue(`🤖 Headless mode: ${headless}`));
  console.log(
    chalk.blue(
      `📍 Using coordinates from settings: Lat ${latitude}, Lon ${longitude}`
    )
  );

  const browser = await puppeteer.launch({
    headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--start-maximized",
    ],
  });

  try {
    const context = browser.defaultBrowserContext();
    const zeptoOrigin = "https://www.zeptonow.com";

    await context.overridePermissions(zeptoOrigin, ["geolocation"]);
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setGeolocation({ latitude, longitude });

    console.log(chalk.blue("Navigating to Zepto website..."));
    await page.goto(zeptoOrigin, { waitUntil: "networkidle2" });

    // --- Location Setting ---
    await page.waitForSelector(SELECTORS.locationButton, {
      visible: true,
      timeout: 15000,
    });
    await page.click(SELECTORS.locationButton);
    await delay(1000);
    await page.waitForSelector(SELECTORS.enableLocationButton, {
      visible: true,
      timeout: 10000,
    });
    await page.click(SELECTORS.enableLocationButton);
    await page.waitForSelector(SELECTORS.locationConfirmation, {
      visible: true,
      timeout: 20000,
    });
    console.log(chalk.green.bold("✅ Successfully set location on Zepto!"));

    // ✅ ADDED DELAY: Wait for 5 seconds to ensure the page state updates.
    console.log(
      chalk.gray("Pausing for 5 seconds to ensure location is fully set...")
    );
    await delay(5000);

    // --- Search Loop ---
    for (const type of productTypes) {
      console.log(chalk.yellow(`\n🔍 Searching for category: "${type}"`));

      const searchUrl = `${zeptoOrigin}/search?query=${encodeURIComponent(
        type
      )}`;
      console.log(chalk.blue(`Navigating to search URL: ${searchUrl}`));
      await page.goto(searchUrl, { waitUntil: "networkidle2" });

      console.log(chalk.gray(`Waiting for search results for "${type}"...`));
      await page.waitForSelector(SELECTORS.productCard, { timeout: 15000 });
      console.log(
        chalk.green(
          `✅ Search successful. Product cards are visible for "${type}".`
        )
      );

      await delay(3000); // Pause to observe the results

      /*
      // --- STEP 3: SCRAPE AND SAVE (Commented out for now) ---
      
      const productsOnPage = await page.evaluate((selectors) => {
        // ... scraping logic will go here ...
      }, SELECTORS);

      console.log(chalk.gray(`Found ${productsOnPage.length} products for "${type}".`));

      for (const item of productsOnPage) {
        // ... processing and saving logic will go here ...
      }
      */
    }
  } catch (err) {
    console.error(chalk.red("❌ Zepto Scrape failed -"), err.message);
  } finally {
    console.log(chalk.cyan("🚀 Closing Zepto Scraper."));
    if (browser) {
      await browser.close();
    }
  }

  return updatedProducts;
}

