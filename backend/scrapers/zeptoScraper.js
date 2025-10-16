// backend/scrapers/zeptoScraper.js
import chalk from "chalk";
import puppeteer from "puppeteer";
import { getHeadlessSetting } from "../utils/helpers.js"; // Import getSetting
import { getSetting } from "../utils/settings.js";

// --- SELECTORS FOR ZEPTO ---
const SELECTORS = {
  locationButton: 'button[aria-label="Select Location"]',
  enableLocationButton: "button.cpG2SV.cVzWKq.cimLEg",
  locationConfirmation: '[data-testid="search-bar-icon"]',
  // searchInput: 'input[placeholder="Search for over 5000 products"]',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The pincode argument is no longer needed
export async function scrapeZepto() {
  const headless = await getHeadlessSetting();

  // --- DYNAMIC LOCATION SETUP ---
  // Fetch coordinates directly from settings
  const latitude = await getSetting("ZEPTO_LATITUDE", 22.7196);
  const longitude = await getSetting("ZEPTO_LONGITUDE", 75.8577);

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
    console.log(chalk.yellow("✅ Geolocation permission granted for Zepto."));

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // Use the dynamic coordinates from settings
    await page.setGeolocation({ latitude, longitude });
    console.log(
      chalk.yellow(`📍 Geolocation set to (${latitude}, ${longitude}).`)
    );

    console.log(chalk.blue("Navigating to Zepto website..."));
    await page.goto(zeptoOrigin, { waitUntil: "networkidle2" });

    await page.waitForSelector(SELECTORS.locationButton, {
      visible: true,
      timeout: 15000,
    });
    await page.click(SELECTORS.locationButton);
    console.log(chalk.green("✅ Clicked 'Select Location' button."));
    await delay(1000);

    await page.waitForSelector(SELECTORS.enableLocationButton, {
      visible: true,
      timeout: 10000,
    });
    await page.click(SELECTORS.enableLocationButton);
    console.log(chalk.green("✅ Clicked 'Enable' button inside the modal."));

    await page.waitForSelector(SELECTORS.locationConfirmation, {
      visible: true,
      timeout: 20000,
    });

    console.log(chalk.green.bold("✅ Successfully set location on Zepto!"));
    console.log(
      chalk.gray(
        "Scraper is now ready for search and product extraction steps."
      )
    );

    await delay(5000);
  } catch (err) {
    console.error(chalk.red("❌ Zepto Scrape failed -"), err.message);
  } finally {
    console.log(chalk.cyan("🚀 Closing Zepto Scraper."));
    if (browser) {
      await browser.close();
    }
  }

  return [];
}

