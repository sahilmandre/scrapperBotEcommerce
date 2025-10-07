// backend/server.js - Updated version with JioMart support
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cron from "node-cron";
import analyticsRouter from "./routes/analytics.js";
import dealsRouter from "./routes/deals.js";
import productsRouter from "./routes/products.js";
import scrapeRouter from "./routes/scrape.js";
import settingsRouter from "./routes/settings.js";
import { scrapeAmazon } from "./scrapers/amazon.js";
import { scrapeFlipkart } from "./scrapers/flipkart.js";
import { scrapeJiomart } from "./scrapers/jiomart.js";
import { initializeSettings, getSetting } from "./utils/settings.js"; // ✅ Import getSetting

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await initializeSettings();
    await setupCronJob(); // Setup cron job after settings are initialized
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Auto Run Scraping with dynamic interval
let currentCronJob = null;

async function setupCronJob() {
  try {
    const interval = await getSetting("SCRAPE_INTERVAL", 30);
    const pincode = await getSetting("PINCODE"); // ✅ Fetch pincode

    if (currentCronJob) {
      currentCronJob.stop();
    }

    const cronExpression = `*/${interval} * * * *`;
    currentCronJob = cron.schedule(cronExpression, async () => {
      console.log("⏱️ Running scheduled scraping task...");
      await Promise.all([
        scrapeAmazon(pincode), // ✅ Pass pincode
        scrapeFlipkart(pincode), // ✅ Pass pincode
        scrapeJiomart(pincode), // ✅ Pass pincode
      ]);
      console.log("✅ Scheduled scraping completed.");
    });

    console.log(`🕒 Cron job scheduled to run every ${interval} minutes.`);
  } catch (error) {
    console.error("❌ Error setting up cron job:", error);
  }
}

// API Routes
app.use("/api/scrape", scrapeRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/products", productsRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export { setupCronJob };
