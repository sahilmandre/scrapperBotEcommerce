// routes/scrape.js
import express from "express";
import { scrapeFlipkartDeals } from "../scrapers/flipkart.js";

const router = express.Router();

router.get("/flipkart", async (req, res) => {
  try {
    await scrapeFlipkartDeals();
    res.json({ message: "✅ Scraping complete and saved to flipkart.json" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Scraping failed" });
  }
});

export default router;
