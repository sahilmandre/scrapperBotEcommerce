// backend/routes/scrape.js
import express from "express";
import { scrapeFlipkart } from "../scrapers/flipkart.js";
import { scrapeAmazon } from "../scrapers/amazon.js";
import { scrapeJiomart } from "../scrapers/jiomart.js";
import { scrapeZepto } from "../scrapers/zeptoScraper.js";
import { scrapeBigBasket } from "../scrapers/bigbasketScraper.js"; // Import the new scraper
import { getSetting } from "../utils/settings.js";
import chalk from "chalk";

const router = express.Router();

router.get("/:platform", async (req, res) => {
  const { platform } = req.params;
  let data = [];

  try {
    const pincode = await getSetting("PINCODE");

    if (platform === "flipkart") {
      console.log(chalk.blue("🛒 Scraping Flipkart..."));
      data = await scrapeFlipkart(pincode);
    } else if (platform === "amazon") {
      console.log(chalk.yellow("📦 Scraping Amazon..."));
      data = await scrapeAmazon(pincode);
    } else if (platform === "jiomart") {
      console.log(chalk.magenta("🏪 Scraping JioMart..."));
      data = await scrapeJiomart(pincode);
    } else if (platform === "zepto") {
      console.log(chalk.magenta("⚡ Scraping Zepto..."));
      data = await scrapeZepto();
    } else if (platform === "bigbasket") {
      // Add new "bigbasket" condition
      console.log(chalk.hex("#5E9400")("🧺 Scraping BigBasket..."));
      data = await scrapeBigBasket(pincode);
    } else if (platform === "all") {
      console.log(chalk.cyan("🔁 Scraping all platforms..."));
      const [flipkartData, amazonData, jiomartData, zeptoData, bigbasketData] = // Add bigbasketData
        await Promise.all([
          scrapeFlipkart(pincode),
          scrapeAmazon(pincode),
          scrapeJiomart(pincode),
          scrapeZepto(),
          scrapeBigBasket(pincode), // Add the new scraper to the "all" execution
        ]);

      return res.json({
        message: "✅ All scraping complete",
        results: {
          flipkart: flipkartData.length,
          amazon: amazonData.length,
          jiomart: jiomartData.length,
          zepto: zeptoData.length,
          bigbasket: bigbasketData.length, // Add to the results object
        },
        total:
          flipkartData.length +
          amazonData.length +
          jiomartData.length +
          zeptoData.length +
          bigbasketData.length,
      });
    } else {
      return res.status(400).json({
        error: "❌ Unsupported platform.",
      });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: `✅ ${platform} scrape complete. No new high-discount products found.`,
      });
    }

    res.json({
      message: `✅ ${platform} scrape complete. Found ${data.length} new deals.`,
      count: data.length,
    });
  } catch (err) {
    console.error("❌ Scrape error:", err.message);
    res.status(500).json({ error: "Scraping failed" });
  }
});

export default router;
