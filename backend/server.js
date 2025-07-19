// index.js
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cron from "node-cron";
import analyticsRouter from "./routes/analytics.js";
import dealsRouter from "./routes/deals.js";
import scrapeRouter from "./routes/scrape.js";
import { scrapeAmazon } from "./scrapers/amazon.js";
import { scrapeFlipkart } from "./scrapers/flipkart.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI;

//Auto Run Scraping
cron.schedule("*/30 * * * *", async () => {
  console.log("⏱️ Running scheduled scraping task...");
  await scrapeAmazon();
  await scrapeFlipkart();
  console.log("✅ Scraping completed.");
});

app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/scrape", scrapeRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/analytics", analyticsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


