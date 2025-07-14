// routes/scrape.js
import express from "express";
import { scrapeFlipkart } from "../scrapers/flipkart.js";
import { scrapeAmazon } from "../scrapers/amazon.js";

const router = express.Router();

router.get("/:platform", async (req, res) => {
  const { platform } = req.params;
  let data = [];

  try {
    if (platform === "flipkart") {
      data = await scrapeFlipkart();
    } else if (platform === "amazon") {
      data = await scrapeAmazon();
    } else {
      return res.status(400).json({ error: "Unsupported platform" });
    }

    if (!data || data.length === 0) {
      console.log("❌ No qualifying deals found.");
      return res.status(404).json({ message: "No products found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: "Scraping failed" });
  }
});

export default router;
