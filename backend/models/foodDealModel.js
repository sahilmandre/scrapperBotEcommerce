// backend/models/foodDealModel.js

import mongoose from "mongoose";

const foodDealSchema = new mongoose.Schema({
  dishName: { type: String, required: true },
  restaurantName: { type: String, required: true, index: true },
  cuisine: { type: String },
  rating: { type: String },
  price: { type: String, required: true },
  discount: { type: String },
  image: { type: String },
  link: { type: String, required: true },
  platform: { type: String, required: true, index: true },
  scrapedAt: { type: Date, default: Date.now },
});

const FoodDeal = mongoose.model("FoodDeal", foodDealSchema);

export default FoodDeal;
