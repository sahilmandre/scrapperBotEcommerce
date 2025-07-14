import express from "express";
import { scrapeFlipkart } from "../scrapers/flipkart.js";
import { scrapeAmazon } from "../scrapers/amazon.js";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/:platform", async (req, res) => {
  const { platform } = req.params;
  let data = [];

  try {
    if (platform === "flipkart") {
      data = await scrapeFlipkart();
    } else if (platform === "amazon") {
      data = await scrapeAmazon();
    } else if (platform === "all") {
      const [flipkartData, amazonData] = await Promise.all([
        scrapeFlipkart(),
        scrapeAmazon(),
      ]);
      data = [...flipkartData, ...amazonData];
    } else {
      return res.status(400).json({ error: "Unsupported platform" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // ✅ Save to deals.json
    const filePath = path.resolve("results", "deals.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json(data);
  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: "Scraping failed" });
  }
});

export default router;
