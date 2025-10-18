// backend/scrapers/bigbasketScraper.js
import chalk from "chalk";
import puppeteer from "puppeteer";
import { getHeadlessSetting } from "../utils/helpers.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- SELECTORS FOR BIGBASKET ---
const SELECTORS = {
  // CORRECTED and VERIFIED: Using the highly specific selector that correctly targets the location button.
  locationDropdownButton:
    'button[class*="AddressDropdown___StyledMenuButton-sc-i4k67t-1"][id^="headlessui-menu-button-"]',

  // Selectors for the location pop-up
  pincodeInput: 'input[class*="AddressDropdown___StyledInput"]',
  firstLocationSuggestion:
    'li[class*="AddressDropdown___StyledMenuItem-sc-i4k67t-7"]:first-child',
};

/**
 * Scrapes BigBasket for product deals. This is the main function.
 * @param {string} pincode - The 6-digit pincode for the delivery location.
 */
export async function scrapeBigBasket(pincode) {
  const headless = await getHeadlessSetting();
  const updatedProducts = [];

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
        "--start-maximized",
        "--window-position=0,0",
      ],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1040, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // --- Navigate to a search page ---
    await page.goto("https://www.bigbasket.com/", {
      waitUntil: "networkidle2",
    });
    console.log(chalk.gray("Navigated to the BigBasket homepage."));

    // --- Part 1: Location Setup ---
    console.log(chalk.yellow("🔧 Setting delivery location..."));

    // Wait for page to fully load
    await delay(2000);

    // Click the location dropdown button using the verified method
    await page.waitForSelector(SELECTORS.locationDropdownButton, {
      visible: true,
      timeout: 30000,
    });

    const clicked = await page.evaluate((selector) => {
      const button = document.querySelector(selector);
      if (button && button.textContent.includes("Select Location")) {
        button.click();
        return true;
      }
      // Fallback for multiple buttons
      const buttons = document.querySelectorAll(selector);
      for (const btn of buttons) {
        if (btn.textContent.includes("Select Location")) {
          btn.click();
          return true;
        }
      }
      return false;
    }, SELECTORS.locationDropdownButton);

    if (!clicked) {
      throw new Error(
        "Could not find or click 'Select Location' button via evaluate."
      );
    }
    console.log(chalk.gray("Clicked location dropdown."));

    // Wait longer for dropdown to fully open
    await delay(3000);

    // Try multiple selectors for the input field
    let inputFound = false;
    const inputSelectors = [
      'input[class*="AddressDropdown___StyledInput"]',
      'input[placeholder="Search for area or street name"]',
      'input[type="text"]',
    ];

    for (const selector of inputSelectors) {
      try {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
        await page.click(selector);
        await delay(1000);

        // Use evaluate to directly set value and trigger events
        await page.evaluate(
          (sel, pin) => {
            const input = document.querySelector(sel);
            if (input) {
              input.focus();
              input.value = pin;
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
          },
          selector,
          pincode
        );

        console.log(
          chalk.gray(`Typed pincode "${pincode}" using selector: ${selector}`)
        );
        inputFound = true;
        break;
      } catch (e) {
        console.log(
          chalk.yellow(`Selector ${selector} failed, trying next...`)
        );
      }
    }

    if (!inputFound) {
      throw new Error("Could not find input field with any selector");
    }

    // Wait for suggestions to load after typing
    await delay(3000);

    // Wait for the suggestions list to appear
    await page.waitForSelector(SELECTORS.firstLocationSuggestion, {
      visible: true,
      timeout: 15000,
    });

    // Click the first location suggestion
    await page.click(SELECTORS.firstLocationSuggestion);
    console.log(chalk.gray("Clicked first location suggestion."));

    // Wait for the page to update after selection
    await delay(3000);
    console.log(chalk.green.bold("✅ Successfully set location!"));

    // --- DEBUGGING: Keep browser open for 2 minutes for inspection ---
    if (!headless) {
      console.log(
        chalk.magenta.bold(
          "🕵️ Pausing for 2 minutes for inspection. The browser will close automatically."
        )
      );
      await delay(120000);
    }
  } catch (err) {
    console.error(chalk.red("❌ BigBasket Scrape failed:"), err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log(chalk.cyan.bold("🚀 Closing BigBasket Scraper."));
  }

  return updatedProducts;
}

