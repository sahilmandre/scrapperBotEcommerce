// backend/scrapers/zeptoScraper.js
import chalk from "chalk";
import puppeteer from "puppeteer";
import Product from "../models/product.js";
import {
  calculateDiscount,
  getDiscountThreshold,
  getHeadlessSetting,
  getScrapingUrls,
} from "../utils/helpers.js";

// --- SELECTORS FOR ZEPTO ---
// Storing selectors here makes them easier to update if the site changes.
const SELECTORS = {
  locationBannerButton: 'button.u-flex.u-items-center.__4y7HY',
  enableLocationButton: 'button.cpG2SV.cVzWKq.cimLEg', // The "Enable" button inside the modal
  mainSearchIcon: '[data-testid="search-bar-icon"]',
  modalSearchInput: 'input[id*="--input"]', 
  productCard: 'a[href*="/pn/"]', // A selector for a product card to confirm page load
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function scrapeZepto(pincode) {
  const threshold = await getDiscountThreshold();
  const headless = await getHeadlessSetting();
  const urls = await getScrapingUrls(); 

  console.log(chalk.magenta(`\n✨ Starting Zepto Scraper...`));
  console.log(chalk.blue(`🎯 Zepto: Using discount threshold: ${threshold}%`));
  console.log(chalk.blue(`🎯 Zepto: Using location based on pincode: ${pincode}`));

  const updatedProducts = [];
  const browser = await puppeteer.launch({ 
    headless,
    args: ['--disable-notifications', '--disable-geolocation'] 
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://www.zeptonow.com', ['geolocation']);
    
    await page.goto("https://www.zeptonow.com/", { waitUntil: "networkidle2" });
    
    console.log(chalk.yellow("🔧 Zepto: Setting delivery location..."));
    
    // 1. Click the top banner to open the location modal
    await page.waitForSelector(SELECTORS.locationBannerButton, { timeout: 15000 });
    await page.click(SELECTORS.locationBannerButton);
    
    // 2. Click the "Enable" button for current location
    await page.waitForSelector(SELECTORS.enableLocationButton, { timeout: 10000 });
    await page.click(SELECTORS.enableLocationButton);

    console.log(chalk.green("✅ Zepto: Location set. Waiting for homepage to load..."));
    // Wait for a known element that indicates the homepage is ready
    await page.waitForSelector(SELECTORS.mainSearchIcon, { timeout: 20000 });
    await delay(3000); 

    for (const { type } of urls) { 
      console.log(chalk.blue(`🔍 Scraping Zepto for [${type}]...`));
      
      try {
        // 3. Click the main search icon to bring up the search input modal
        await page.waitForSelector(SELECTORS.mainSearchIcon);
        await page.click(SELECTORS.mainSearchIcon);

        // 4. Type into the now-visible search input and press Enter
        await page.waitForSelector(SELECTORS.modalSearchInput);
        await page.type(SELECTORS.modalSearchInput, type, { delay: 100 });
        await page.keyboard.press('Enter');

        // 5. Intercept the API response
        const response = await page.waitForResponse(
          (res) => res.url().includes("cdn.bff.zeptonow.com/api/v3/search") && res.status() === 200,
          { timeout: 20000 }
        );

        const data = await response.json();
        let products = [];
        if (data && data.layout) {
            for (const widget of data.layout) {
                if (widget.widgetId === 'PRODUCT_GRID' && widget.data?.resolver?.data?.items) {
                    widget.data.resolver.data.items.forEach(item => {
                        if (item.productResponse) products.push(item.productResponse);
                    });
                }
            }
        }
        
        console.log(chalk.gray(`🧪 Found ${products.length} product entries from Zepto API.`));

        for (const item of products) {
          const priceData = item; 
          const productData = item.product;
          const variantData = item.productVariant;
          
          if (!priceData || !productData || !variantData) continue;

          // Prices are in paisa, convert to rupees
          const price = priceData.sellingPrice / 100;
          const mrp = priceData.mrp / 100;
          const discount = calculateDiscount(price, mrp);

          if (discount >= threshold) {
            const productId = `zepto-${productData.id}-${variantData.id}`;
            const image = (variantData.images && variantData.images.length > 0) 
              ? `https://cdn.zeptonow.com/production///${variantData.images[0].path}`
              : 'https://placehold.co/150x150/eee/ccc?text=No+Image';

            const newPriceEntry = {
              price: `₹${price.toFixed(2)}`,
              mrp: `₹${mrp.toFixed(2)}`,
              discount,
              scrapedAt: new Date(),
            };

            const updatedProduct = await Product.findOneAndUpdate(
              { productId: productId },
              {
                $set: {
                  title: productData.name,
                  image: image,
                  link: `https://www.zeptonow.com/p/${productData.id}/${variantData.id}`,
                  platform: "zepto",
                },
                $setOnInsert: { type },
                $push: { priceHistory: { $each: [newPriceEntry], $slice: -90 } },
              },
              { upsert: true, new: true }
            );

            console.log(chalk.green(`✅ Added new deal: ${updatedProduct.title.substring(0, 40)}... | ${discount}% off`));
            updatedProducts.push(updatedProduct);
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ Zepto: Could not find API results for "${type}".`), error.message);
      }
      
      // Go back to the homepage to reset the state for the next search term.
      await page.goto("https://www.zeptonow.com/", { waitUntil: "networkidle2" });
      await page.waitForSelector(SELECTORS.mainSearchIcon);
    }
  } catch (error) {
    console.error(`❌ A critical error occurred in the Zepto scraper: `, error.message);
  } finally {
    await browser.close();
  }
  return updatedProducts;
}

