// routes/deals.js
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/", (req, res) => {
  const amazonPath = path.resolve("results", "amazonDeals.json");
  const flipkartPath = path.resolve("results", "flipkartDeals.json");

  try {
    const amazonData = fs.existsSync(amazonPath)
      ? JSON.parse(fs.readFileSync(amazonPath, "utf-8"))
      : [];

    const flipkartData = fs.existsSync(flipkartPath)
      ? JSON.parse(fs.readFileSync(flipkartPath, "utf-8"))
      : [];

    let deals = [...amazonData, ...flipkartData];

    const { type, minDiscount } = req.query;

    if (type) {
      deals = deals.filter(
        (deal) => deal.type?.toLowerCase() === type.toLowerCase()
      );
    }

    if (minDiscount) {
      const threshold = parseInt(minDiscount);
      if (!isNaN(threshold)) {
        deals = deals.filter((deal) => deal.discount >= threshold);
      }
    }

    res.json(deals);
  } catch (err) {
    console.error("❌ Failed to load deals:", err.message);
    res.status(500).json({ error: "Failed to load deals" });
  }
});

export default router;
