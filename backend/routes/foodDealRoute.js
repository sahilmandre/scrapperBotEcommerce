import express from "express";
import FoodDeal from "../models/foodDealModel.js";

const router = express.Router();

// GET /api/foodDeals
router.get("/", async (req, res) => {
  try {
    // Basic query for now, will be expanded later
    const deals = await FoodDeal.find({}).sort({ scrapedAt: -1 }).limit(50);
    res.json(deals);
  } catch (error) {
    console.error("❌ Error fetching food deals:", error);
    res.status(500).json({ error: "Failed to fetch food deals" });
  }
});

export default router;
