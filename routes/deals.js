// routes/deals.js
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

function readDeals(filePath) {
  try {
    const fullPath = path.resolve("results", filePath);
    const data = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.warn(`⚠️ Could not read ${filePath}:`, err.message);
    return [];
  }
}

router.get("/", (req, res) => {
  const amazonDeals = readDeals("amazondeals.json");
  const flipkartDeals = readDeals("flipkartdeals.json");

  let deals = [...amazonDeals, ...flipkartDeals];

  const { platform, type, minDiscount } = req.query;

  if (platform) {
    deals = deals.filter(
      (deal) => deal.platform?.toLowerCase() === platform.toLowerCase()
    );
  }

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
});

export default router;
