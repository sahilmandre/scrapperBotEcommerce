import express from "express";
import { scrapeFlipkart } from "../scrapers/flipkart.js";
import { scrapeAmazon } from "../scrapers/amazon.js";
import { scrapeJiomart } from "../scrapers/jiomart.js";
import { getSetting } from "../utils/settings.js"; // ✅ Import getSetting
import chalk from "chalk";

const router = express.Router();

router.get("/:platform", async (req, res) => {
  const { platform } = req.params;
  let data = [];

  try {
    const pincode = await getSetting("PINCODE"); // ✅ Fetch pincode

    if (platform === "flipkart") {
      console.log(chalk.blue("🛒 Scraping Flipkart..."));
      data = await scrapeFlipkart(pincode); // ✅ Pass pincode
    } else if (platform === "amazon") {
      console.log(chalk.yellow("📦 Scraping Amazon..."));
      data = await scrapeAmazon(pincode); // ✅ Pass pincode
    } else if (platform === "jiomart") {
      console.log(chalk.magenta("🏪 Scraping JioMart..."));
      data = await scrapeJiomart(pincode); // ✅ Pass pincode
    } else if (platform === "all") {
      console.log(chalk.cyan("🔁 Scraping Amazon, Flipkart & JioMart..."));
      const [flipkartData, amazonData, jiomartData] = await Promise.all([
        scrapeFlipkart(pincode), // ✅ Pass pincode
        scrapeAmazon(pincode), // ✅ Pass pincode
        scrapeJiomart(pincode), // ✅ Pass pincode
      ]);

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
      return res
        .status(200)
        .json({
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
