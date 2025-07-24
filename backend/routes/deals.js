import express from "express";
import Product from "../models/product.js";

const router = express.Router();

// GET /api/deals
router.get("/", async (req, res) => {
  try {
    const { searchQuery, selectedType, minDiscount, platform } = req.query;

    // --- Build the initial match stage for the aggregation pipeline ---
    const matchStage = {};
    const andClauses = [];

    if (platform) {
      andClauses.push({ platform: platform });
    }
    if (searchQuery) {
      andClauses.push({ title: { $regex: searchQuery, $options: "i" } });
    }

    // ✅ ROBUST CATEGORY FILTERING LOGIC
    if (selectedType) {
      // This clause finds products that EITHER have the correct 'type' field (new data)
      // OR are missing the 'type' field but have the category name in their title (old data).
      andClauses.push({
        $or: [
          { type: selectedType },
          {
            type: { $exists: false },
            title: { $regex: selectedType, $options: "i" },
          },
        ],
      });
    }

    if (andClauses.length > 0) {
      matchStage.$and = andClauses;
    }

    // --- Build the Aggregation Pipeline ---
    const pipeline = [
      // Stage 1: Initial filtering
      { $match: matchStage },
      // Stage 2: Add a new field 'latestDeal'
      { $addFields: { latestDeal: { $arrayElemAt: ["$priceHistory", -1] } } },
      // Stage 3: Filter by discount if provided
      ...(minDiscount
        ? [
            {
              $match: {
                "latestDeal.discount": { $gte: parseInt(minDiscount) },
              },
            },
          ]
        : []),
      // Stage 4: Sort by the latest deal's date
      { $sort: { "latestDeal.scrapedAt": -1 } },
    ];

    const products = await Product.aggregate(pipeline);

    // --- Map the results ---
    const deals = products.map((product) => ({
      _id: product._id,
      productId: product.productId,
      title: product.title,
      image: product.image,
      link: product.link,
      platform: product.platform,
      price: product.latestDeal.price,
      mrp: product.latestDeal.mrp,
      discount: product.latestDeal.discount,
    }));

    res.json(deals);
  } catch (error) {
    console.error("❌ Error fetching deals:", error);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

export default router;
