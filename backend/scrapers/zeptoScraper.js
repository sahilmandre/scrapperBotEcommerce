// backend/scrapers/zeptoScraper.js
import chalk from "chalk";
import puppeteer from "puppeteer";
import Product from "../models/product.js";
import {
  getHeadlessSetting,
  getDiscountThreshold,
  calculateDiscount,
  cleanText,
} from "../utils/helpers.js";
import { getSetting } from "../utils/settings.js";

// --- SELECTORS FOR ZEPTO ---
const SELECTORS = {
  locationButton: 'button[aria-label="Select Location"]',
  enableLocationButton: "button.cpG2SV.cVzWKq.cimLEg",
  locationConfirmation: '[data-testid="search-bar-icon"]',
  productLink: 'a[href^="/pn/"]', // The anchor tag that wraps the entire product card
  productTitle: '[data-slot-id="ProductName"]',
  productImage: "img.c2ahfT",
  productPrice: "p.cGFDG0", // The current price
  productMrp: "p.cFLlze", // The striked-out (original) price
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Automatically scrolls to the bottom of the page to trigger infinite scroll loading.
 * @param {import('puppeteer').Page} page The Puppeteer page object.
 */
async function autoScroll(page) {
  console.log(chalk.gray("🔄 Scrolling to load all products..."));
  let lastHeight = await page.evaluate("document.body.scrollHeight");
  let scrollAttempts = 0;
  while (scrollAttempts < 10) {
    // Limit scrolls to prevent infinite loops
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await delay(2500); // Wait for new content to load
    let newHeight = await page.evaluate("document.body.scrollHeight");
    if (newHeight === lastHeight) {
      break;
    }
    lastHeight = newHeight;
    scrollAttempts++;
  }
  console.log(chalk.gray("✅ Finished scrolling."));
}

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

    console.log(
      chalk.gray("Pausing for 5 seconds to ensure location is fully set...")
    );
    await delay(5000);

    // --- Search and Scrape Loop ---
    for (const type of productTypes) {
      console.log(
        chalk.yellow(`\n🔍 Searching and scraping for category: "${type}"`)
      );

      const searchUrl = `${zeptoOrigin}/search?query=${encodeURIComponent(
        type
      )}`;
      console.log(chalk.blue(`Navigating to search URL: ${searchUrl}`));
      await page.goto(searchUrl, { waitUntil: "networkidle2" });

      console.log(
        chalk.gray(`Waiting for initial search results for "${type}"...`)
      );
      await page.waitForSelector(SELECTORS.productLink, { timeout: 15000 });

      // ✅ IMPLEMENTED INFINITE SCROLL
      await autoScroll(page);

      const productsOnPage = await page.evaluate((selectors) => {
        const items = [];
        document.querySelectorAll(selectors.productLink).forEach((card) => {
          const href = card.getAttribute("href");

          // ✅ FIX: Validate URL structure before processing
          if (href && href.includes("/pvid/")) {
            const title = card
              .querySelector(selectors.productTitle)
              ?.innerText.trim();
            const image = card.querySelector(selectors.productImage)?.src;
            const priceText = card
              .querySelector(selectors.productPrice)
              ?.innerText.trim();
            const mrpText = card
              .querySelector(selectors.productMrp)
              ?.innerText.trim();

            if (title && priceText) {
              items.push({
                title,
                image,
                price: priceText,
                mrp: mrpText || priceText,
                href: href,
              });
            }
          }
        });
        return items;
      }, SELECTORS);

      console.log(
        chalk.gray(`Found ${productsOnPage.length} products for "${type}".`)
      );

      // --- Process and Save Deals ---
      for (const item of productsOnPage) {
        const price = parseInt(cleanText(item.price));
        const mrp = parseInt(cleanText(item.mrp));
        const discount = calculateDiscount(price, mrp);

        if (discount >= threshold) {
          const pvidMatch = item.href.match(/pvid\/([a-f0-9-]+)/);
          if (!pvidMatch || !pvidMatch[1]) continue;

          const productId = `zepto-${pvidMatch[1]}`;
          const productUrl = `${zeptoOrigin}${item.href}`;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const product = await Product.findOne({
            productId: productId,
            "priceHistory.scrapedAt": { $gte: today },
          });

          if (!product) {
            const newPriceEntry = {
              price: item.price,
              mrp: item.mrp,
              discount,
              scrapedAt: new Date(),
            };

            const updatedProduct = await Product.findOneAndUpdate(
              { productId },
              {
                $set: {
                  title: item.title,
                  image: item.image || "",
                  link: productUrl,
                  platform: "zepto",
                  type: type,
                },
                $push: {
                  priceHistory: { $each: [newPriceEntry], $slice: -90 },
                },
              },
              { upsert: true, new: true }
            );

            console.log(
              chalk.green(
                `✅ Saved new deal: ${updatedProduct.title.substring(
                  0,
                  40
                )}... | ${discount}% off`
              )
            );
            updatedProducts.push(updatedProduct);
          }
        }
      }
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

