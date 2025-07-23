import express from "express";
import { scrapeFlipkart } from "../scrapers/flipkart.js";
import { scrapeAmazon } from "../scrapers/amazon.js";
import { scrapeJiomart } from "../scrapers/jiomart.js";
import chalk from "chalk";

const router = express.Router();

router.get("/:platform", async (req, res) => {
  const { platform } = req.params;
  let data = [];

  try {
    if (platform === "flipkart") {
      console.log(chalk.blue("🛒 Scraping Flipkart..."));
      data = await scrapeFlipkart();
    } else if (platform === "amazon") {
      console.log(chalk.yellow("📦 Scraping Amazon..."));
      data = await scrapeAmazon();
    } else if (platform === "jiomart") {
      console.log(chalk.magenta("🏪 Scraping JioMart..."));
      data = await scrapeJiomart();
    } else if (platform === "all") {
      console.log(chalk.cyan("🔁 Scraping Amazon, Flipkart & JioMart..."));
      const [flipkartData, amazonData, jiomartData] = await Promise.all([
        scrapeFlipkart(),
        scrapeAmazon(),
        scrapeJiomart(),
      ]);

      // The data is already structured perfectly. We'll return this object.
      return res.json({
        message: "✅ All scraping complete",
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
          "❌ Unsupported platform. Use: amazon, flipkart, jiomart, or all",
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "❌ No products found" });
    }

    // Response for single scrapes
    res.json({
      message: `✅ ${platform} scrape complete. Found ${data.length} deals.`,
      count: data.length,
    });
  } catch (err) {
    console.error("❌ Scrape error:", err.message);
    res.status(500).json({ error: "Scraping failed" });
  }
});

export default router;
