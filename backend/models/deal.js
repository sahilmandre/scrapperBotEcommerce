//...backend/models/deal.js
import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  platform: String,
  type: String,
  title: String,
  price: String,
  mrp: String,
  link: String,
  discount: Number,
  image: String,
  scrapedAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 2, // ⏱️ Auto-delete after 2 days (TTL)

    //   scrapedAt: { type: Date, default: Date.now }, // ✅ Timestamp
  },
});

// ✅ Add indexes
dealSchema.index({ type: 1 });
dealSchema.index({ platform: 1 });
dealSchema.index({ discount: -1 });
dealSchema.index({ scrapedAt: 1 });

const Deal = mongoose.model("Deal", dealSchema);

export default Deal;
