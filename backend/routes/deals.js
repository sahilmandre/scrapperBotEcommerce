import express from "express";
import Product from "../models/product.js"; // ✅ Import the Product model

const router = express.Router();

// GET /api/deals
// This endpoint now fetches the latest deal information from the 'products' collection.
router.get("/", async (req, res) => {
  try {
    const { type, minDiscount, platform } = req.query;

    // --- Build Query Filters ---
    const queryFilter = {};
    if (platform) {
      queryFilter.platform = platform;
    }
    // For text search on title (case-insensitive)
    if (type) {
      queryFilter.title = { $regex: type, $options: "i" };
    }
    // Filter by the discount of the LATEST price entry
    if (minDiscount) {
      // This ensures we only match products where the most recent deal meets the discount
      queryFilter["priceHistory.0.discount"] = { $gte: parseInt(minDiscount) };
    }

    // --- Fetch and Format Data ---
    // Find products matching the filters.
    // Sort by the most recently scraped products first.
    const products = await Product.find(queryFilter).sort({
      "priceHistory.0.scrapedAt": -1,
    });

    // Transform the product data into the "deal" format the frontend expects.
    const deals = products.map((product) => {
      // Get the most recent price entry from the history array.
      const latestDeal = product.priceHistory[product.priceHistory.length - 1];

      return {
        _id: product._id, // Keep a unique ID for React keys
        productId: product.productId, // ✅ CRITICAL: Pass the unique productId
        title: product.title,
        image: product.image,
        link: product.link,
        platform: product.platform,
        // Data from the latest price snapshot
        price: latestDeal.price,
        mrp: latestDeal.mrp,
        discount: latestDeal.discount,
      };
    });

    res.json(deals);
  } catch (error) {
    console.error("❌ Error fetching deals:", error);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

export default router;
