import express from "express";
import { scrapeFlipkart } from "../scrapers/flipkart.js";
import { scrapeAmazon } from "../scrapers/amazon.js";
import { scrapeJiomart } from "../scrapers/jiomart.js";
import { scrapeZepto } from "../scrapers/zeptoScraper.js";
// import { scrapeInstamart } from "../scrapers/swiggyInstamartScraper.js"; // Import the new scraper
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
    // } else if (platform === "instamart") {
    //   // 1. Add new "instamart" condition
    //   console.log(chalk.hex("#F78700")("🛒 Scraping Swiggy Instamart..."));
    //   data = await scrapeInstamart();
    
    } else if (platform === "all") {
      console.log(chalk.cyan("🔁 Scraping all platforms..."));
      // 2. Add the new scraper to the "all" execution
      const [flipkartData, amazonData, jiomartData, zeptoData] =
        await Promise.all([
          scrapeFlipkart(pincode),
          scrapeAmazon(pincode),
          scrapeJiomart(pincode),
          scrapeZepto(),
          
          // Instamart Stopped we will develop it later
          // scrapeInstamart(),
        ]);

      return res.json({
        message: "✅ All scraping complete",
        results: {
          // 3. Add to the results object
          flipkart: flipkartData.length,
          amazon: amazonData.length,
          jiomart: jiomartData.length,
          zepto: zeptoData.length,
          // instamart: instamartData.length,
        },
        total:
          flipkartData.length +
          amazonData.length +
          jiomartData.length +
          zeptoData.length 
          // instamartData.length,
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
