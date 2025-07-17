import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  platform: String,
  type: String,
  title: String,
  price: String,
  mrp: String,
  link: String,
  discount: Number,
});

const Deal = mongoose.model("Deal", dealSchema);

export default Deal; 