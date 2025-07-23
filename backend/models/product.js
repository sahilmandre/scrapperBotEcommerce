import mongoose from "mongoose";

/**
 * Defines the schema for a single price point in a product's history.
 * This is a sub-document and will be embedded within the main Product document.
 */
const priceHistorySchema = new mongoose.Schema({
  price: { type: String, required: true },
  mrp: { type: String, required: true },
  discount: { type: Number, required: true },
  scrapedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Defines the main schema for a product.
 * Each document represents a unique product from an e-commerce platform.
 */
const productSchema = new mongoose.Schema({
  // A unique identifier for the product, generated from its URL.
  // Example: 'amzn-B08N5HR36W' or 'fk-MOBG6FW5S6J7G2DS'
  productId: { 
    type: String, 
    required: true, 
    unique: true, // Ensures no duplicate products are created.
    index: true   // Speeds up finding products by this ID.
  },
  platform: { 
    type: String, 
    required: true, 
    index: true 
  },
  title: { type: String, required: true },
  image: { type: String },
  link: { type: String, required: true },
  
  // An array that will store all the price snapshots for this product.
  priceHistory: [priceHistorySchema],
});

const Product = mongoose.model("Product", productSchema);

export default Product
