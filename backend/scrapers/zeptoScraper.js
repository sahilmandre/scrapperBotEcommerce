// backend/scrapers/zeptoScraper.js
import chalk from "chalk";
import puppeteer from "puppeteer";
import Product from "../models/product.js";
import {
  calculateDiscount,
  cleanText,
  getDiscountThreshold,
  getHeadlessSetting,
  getScrapingUrls,
} from "../utils/helpers.js";

// --- SELECTORS FOR ZEPTO (Updated for maintainability) ---
const SELECTORS = {
  locationBannerButton: 'button[aria-label="Select Location"]',
  enableLocationButton: 'button.cpG2SV.cVzWKq.cimLEg',
  mainSearchIcon: '[data-testid="search-bar-icon"]',
  modalSearchInput: 'input[placeholder="Search for over 5000 products"]',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function scrapeZepto(pincode) {
  const threshold = await getDiscountThreshold();
  const headless = await getHeadlessSetting();
  const urls = await getScrapingUrls(); 

  console.log(chalk.magenta("\n✨ Starting Zepto Scraper..."));
  console.log(chalk.blue(`🎯 Zepto: Using discount threshold: ${threshold}%`));
  console.log(chalk.blue(`🎯 Zepto: Using pincode for location context: ${pincode}`));

  const updatedProducts = [];
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--disable-notifications', '--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // --- STEP 1: SET LOCATION ---
    console.log(chalk.yellow("🔧 Zepto: Setting delivery location..."));
    
    // ✅ DEFINITIVE FIX: Grant location permissions BEFORE navigating
    const context = browser.defaultBrowserContext();
    // await context.s('https://www.zeptonow.com', ['geolocation']);
    
    await page.goto("https://www.zeptonow.com/", { waitUntil: "networkidle2" });
    
    try {
      console.log(chalk.gray("Waiting for location banner..."));
      await page.waitForSelector(SELECTORS.locationBannerButton, { timeout: 15000, visible: true });
      await page.click(SELECTORS.locationBannerButton);
      console.log(chalk.gray("Clicked location banner."));
      
      console.log(chalk.gray("Waiting for 'Enable' button in modal..."));
      await page.waitForSelector(SELECTORS.enableLocationButton, { timeout: 10000, visible: true });
      await page.click(SELECTORS.enableLocationButton);

      console.log(chalk.green("✅ Zepto: Location set successfully. Waiting for homepage to confirm..."));
      // This is the most reliable confirmation that the page has reloaded with a location.
      await page.waitForSelector(SELECTORS.mainSearchIcon, { timeout: 20000, visible: true });
      console.log(chalk.green("✅ Zepto: Homepage confirmed. Location step successful."));

    } catch(e) {
      console.error(chalk.red("❌ Zepto: Failed during location setup:"), e.message);
      throw new Error("Could not set Zepto location.");
    }
    
    console.log(chalk.cyan("--- Location phase complete. Scraper will now stop as planned. ---"));

  } catch (error) {
    console.error(`❌ A critical error occurred in the Zepto scraper: `, error.message);
  } finally {
    console.log(chalk.yellow("Debugging mode: Browser will close in 60 seconds..."));
    await delay(60000); 
    await browser.close();
    console.log(chalk.yellow("Browser closed."));
  }
  return updatedProducts; // Will be empty for this test
}

