// routes/analytics.js
import express from "express";
import Deal from "../models/deal.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalDeals = await Deal.countDocuments();

    const dealsByPlatform = await Deal.aggregate([
      {
        $group: {
          _id: "$platform",
          count: { $sum: 1 },
        },
      },
    ]);

    const dealsByType = await Deal.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const avgDiscountByPlatform = await Deal.aggregate([
      {
        $group: {
          _id: "$platform",
          avgDiscount: { $avg: "$discount" },
        },
      },
    ]);

    const topDiscounts = await Deal.find({}, {
      title: 1,
      discount: 1,
      platform: 1,
      _id: 0,
    })
      .sort({ discount: -1 })
      .limit(5);

    res.json({
      totalDeals,
      dealsByPlatform: Object.fromEntries(
        dealsByPlatform.map((d) => [d._id, d.count])
      ),
      dealsByType: Object.fromEntries(
        dealsByType.map((d) => [d._id, d.count])
      ),
      avgDiscountByPlatform: Object.fromEntries(
        avgDiscountByPlatform.map((d) => [d._id, d.avgDiscount.toFixed(2)])
      ),
      topDiscounts,
    });
  } catch (err) {
    console.error("❌ Analytics error:", err.message);
    res.status(500).json({ error: "Failed to generate analytics" });
  }
});

export default  router;

