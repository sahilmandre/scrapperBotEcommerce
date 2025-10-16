// backend/routes/scrape.js
import express from "express";
import { scrapeFlipkart } from "../scrapers/flipkart.js";
import { scrapeAmazon } from "../scrapers/amazon.js";
import { scrapeJiomart } from "../scrapers/jiomart.js";
// ✅ New Scraper Import
import { scrapeZepto } from "../scrapers/zeptoScraper.js";
import { getSetting } from "../utils/settings.js";
import chalk from "chalk";

const router = express.Router();

router.get("/:platform", async (req, res) => {
  const { platform } = req.params;
  let data = [];

  // Fetch the pincode for scrapers that need it
  const pincode = await getSetting("PINCODE");

  try {
    if (platform === "flipkart") {
      console.log(chalk.blue("🛒 Scraping Flipkart..."));
      data = await scrapeFlipkart(pincode);
    } else if (platform === "amazon") {
      console.log(chalk.yellow("📦 Scraping Amazon..."));
      data = await scrapeAmazon(pincode);
    } else if (platform === "jiomart") {
      console.log(chalk.magenta("🏪 Scraping JioMart..."));
      data = await scrapeJiomart(pincode);
    }
    // ✅ ADDED ZEPTO LOGIC: This block handles the 'zepto' platform
    else if (platform === "zepto") {
      console.log(chalk.magenta("⚡ Scraping Zepto..."));
      data = await scrapeZepto(pincode);
    } else if (platform === "all") {
      console.log(chalk.cyan("🔁 Scraping all e-commerce platforms..."));

      const [flipkartData, amazonData, jiomartData] = await Promise.all([
        scrapeFlipkart(pincode),
        scrapeAmazon(pincode),
        scrapeJiomart(pincode),
        // Note: Zepto is not included in "all" for now to keep it separate.
      ]);

      return res.json({
        message: "✅ All e-commerce scraping complete",
        results: {
          flipkart: flipkartData.length,
          amazon: amazonData.length,
          jiomart: jiomartData.length,
        },
        total: flipkartData.length + amazonData.length + jiomartData.length,
      });
    } else {
      return res.status(400).json({
        error:
          "❌ Unsupported platform. Use: amazon, flipkart, jiomart, zepto, or all",
      });
    }

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: `❌ No products found for ${platform}` });
    }

    res.json({
      message: `✅ ${platform} scrape complete. Found ${data.length} deals.`,
      count: data.length,
    });
  } catch (err) {
    console.error(`❌ Scrape error for platform ${platform}:`, err.message);
    res.status(500).json({ error: "Scraping failed" });
  }
});

export default router;
