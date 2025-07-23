import express from "express";
import Product from "../models/product.js";

const router = express.Router();

// GET /api/products/:productId/history
// Fetches the price history for a single product by its unique productId.
router.get("/:productId/history", async (req, res) => {
  try {
    const { productId } = req.params;

    // Find the product in the database using the productId.
    // We only select the 'priceHistory' and 'title' fields to keep the response lightweight.
    const product = await Product.findOne({ productId }).select('priceHistory title');

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
        title: product.title,
        priceHistory: product.priceHistory
    });
  } catch (error) {
    console.error(`❌ Error fetching price history for ${req.params.productId}:`, error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

export default router;
