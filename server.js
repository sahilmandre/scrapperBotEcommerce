// index.js
import express from "express";
import dotenv from "dotenv";
import scrapeRouter from "./routes/scrape.js";
import dealsRouter from "./routes/deals.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use("/api/scrape", scrapeRouter);
app.use("/api/deals", dealsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
