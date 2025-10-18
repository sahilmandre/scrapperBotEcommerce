// backend/scrapers/bigbasketScraper.js
import chalk from "chalk";
import puppeteer from "puppeteer";
import { getHeadlessSetting } from "../utils/helpers.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- SELECTORS FOR BIGBASKET ---
const SELECTORS = {
  // CORRECTED: Using a highly specific selector based on the button's unique class and dynamic ID prefix.
  // This is a direct fix to avoid clicking the wrong button (e.g., the Login button).
  locationDropdownButton: 'button[class*="AddressDropdown___StyledMenuButton"][id^="headlessui-menu-button-"]',
  
  // These will be used once the click is confirmed to be working
  pincodeInput: 'input[placeholder="Search for area or street name"]',
  firstLocationSuggestion: 'ul[class*="overscroll-contain"] li:first-child',
  locationSetConfirmation: 'div[data-testid="pincode-widget"]',
};

/**
 * Scrapes BigBasket for product deals. This is the main function.
 * @param {string} pincode - The 6-digit pincode for the delivery location.
 */
export async function scrapeBigBasket(pincode) {
  const headless = await getHeadlessSetting();
  const updatedProducts = []; // We will populate this in Part 3

  console.log(chalk.cyan.bold("🚀 Starting BigBasket Scraper..."));
  console.log(chalk.blue(`🤖 Headless mode: ${headless}`));
  console.log(chalk.blue(`🎯 Pincode: ${pincode}`));

  let browser;
  try {
    browser = await puppeteer.launch({
      headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--start-maximized"
      ],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // --- Navigate to a search page to get a cleaner starting point ---
    await page.goto("https://www.bigbasket.com/ps/?q=snacks", {
      waitUntil: "networkidle2",
    });
    console.log(chalk.gray("Navigated to a BigBasket search page."));

    // --- Simplified Test: Just click the correct location button ---
    console.log(chalk.yellow("🔧 Attempting to click the correct 'Select Location' button..."));
    
    await page.waitForSelector(SELECTORS.locationDropdownButton, {
      visible: true,
      timeout: 30000, 
    });
    
    // Using a more reliable click method via page.evaluate
    await page.evaluate((selector) => {
        document.querySelector(selector).click();
    }, SELECTORS.locationDropdownButton);

    console.log(chalk.green.bold("✅ Click command executed for the location dropdown."));
    console.log(chalk.gray("Please verify that the location pop-up appears and NOT the login modal."));
    
    // --- DEBUGGING: Keep browser open for 2 minutes for inspection ---
    if (!headless) {
      console.log(chalk.magenta.bold("🕵️ Pausing for 2 minutes for inspection. The browser will close automatically."));
      await delay(120000);
    }

  } catch (err) {
    console.error(chalk.red("❌ BigBasket Scrape failed during test:"), err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log(chalk.cyan.bold("🚀 Closing BigBasket Scraper test."));
  }

  return updatedProducts;
}

