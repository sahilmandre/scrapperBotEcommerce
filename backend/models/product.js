import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema({
  price: { type: String, required: true },
  mrp: { type: String, required: true },
  discount: { type: Number, required: true },
  scrapedAt: {
    type: Date,
    default: Date.now,
  },
});

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  platform: {
    type: String,
    required: true,
    index: true,
  },
  // ✅ NEW FIELD: Stores the original scrape category (e.g., "branded shirt")
  type: {
    type: String,
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  image: { type: String },
  link: { type: String, required: true },
  priceHistory: [priceHistorySchema],
});

const Product = mongoose.model("Product", productSchema);

export default Product;
