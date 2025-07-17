import express from "express";
import { scrapeFlipkart } from "../scrapers/flipkart.js";
import { scrapeAmazon } from "../scrapers/amazon.js";
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
    } else if (platform === "all") {
      console.log(chalk.cyan("🔁 Scraping Amazon & Flipkart..."));
      const [flipkartData, amazonData] = await Promise.all([
        scrapeFlipkart(),
        scrapeAmazon(),
      ]);
      data = [...flipkartData, ...amazonData];

      return res.json({
        message: "✅ Scraping complete",
        amazon: amazonData.length,
        flipkart: flipkartData.length,
        total: data.length,
      });
    } else {
      return res.status(400).json({ error: "❌ Unsupported platform" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "❌ No products found" });
    }

    res.json({
      message: `✅ ${platform} scrape complete`,
      count: data.length,
      products: data,
    });
  } catch (err) {
    console.error("❌ Scrape error:", err.message);
    res.status(500).json({ error: "Scraping failed" });
  }
});

export default router;
