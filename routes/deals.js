// routes/deals.js
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/", (req, res) => {
  const filePath = path.resolve("results", "flipkart.json");

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    let deals = JSON.parse(data);

    const { type, minDiscount } = req.query;

    // Filter by type
    if (type) {
      deals = deals.filter((deal) =>
        deal.type.toLowerCase() === type.toLowerCase()
      );
    }

    // Filter by minimum discount
    if (minDiscount) {
      const threshold = parseInt(minDiscount);
      if (!isNaN(threshold)) {
        deals = deals.filter((deal) => deal.discount >= threshold);
      }
    }

    res.json(deals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Failed to load deals" });
  }
});

export default router;
