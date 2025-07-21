// server.js - Updated version with JioMart support
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cron from "node-cron";
import cors from "cors";
import analyticsRouter from "./routes/analytics.js";
import dealsRouter from "./routes/deals.js";
import scrapeRouter from "./routes/scrape.js";
import settingsRouter from "./routes/settings.js";
import { scrapeAmazon } from "./scrapers/amazon.js";
import { scrapeFlipkart } from "./scrapers/flipkart.js";
import { scrapeJiomart } from "./scrapers/jiomart.js";
import { initializeSettings } from "./utils/settings.js";

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

    // Initialize settings after DB connection
    await initializeSettings();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Auto Run Scraping with dynamic interval
let currentCronJob = null;

async function setupCronJob() {
  try {
    // Dynamic import to avoid circular dependency
    const { getSetting } = await import("./utils/settings.js");
    const interval = await getSetting("SCRAPE_INTERVAL", 30);

    // Clear existing cron job
    if (currentCronJob) {
      currentCronJob.destroy();
    }

    // Setup new cron job with dynamic interval
    const cronExpression = `*/${interval} * * * *`; // every X minutes
    currentCronJob = cron.schedule(cronExpression, async () => {
      console.log("⏱️ Running scheduled scraping task...");
      await Promise.all([
        scrapeAmazon(),
        scrapeFlipkart(),
        scrapeJiomart(), // Added JioMart to scheduled scraping
      ]);
      console.log("✅ Scraping completed.");
    });

    console.log(`🕒 Cron job scheduled to run every ${interval} minutes`);
  } catch (error) {
    console.error("❌ Error setting up cron job:", error);
  }
}

// Setup initial cron job
setupCronJob();

// API Routes
app.use("/api/scrape", scrapeRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export { setupCronJob }; // Export for potential use in settings update
