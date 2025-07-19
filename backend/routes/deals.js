// routes/deals.js
import express from "express";
import Deal from "../models/deal.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { type, minDiscount, platform } = req.query;

    const filter = {};

    if (type) {
      filter.type = { $regex: new RegExp(type, "i") }; // case-insensitive
    }

    if (platform) {
      filter.platform = platform.toLowerCase();
    }

    if (minDiscount) {
      const threshold = parseInt(minDiscount);
      if (!isNaN(threshold)) {
        filter.discount = { $gte: threshold };
      }
    }

    const deals = await Deal.find(filter).sort({ discount: -1 }); // sort by discount descending
    res.json(deals);
  } catch (err) {
    console.error("❌ Error fetching deals:", err.message);
    res.status(500).json({ error: "Server error while fetching deals" });
  }
});

export default router;
