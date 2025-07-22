// scrapers/amazon.js - Updated version with better MRP handling
import axios from "axios";
import chalk from "chalk";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import {
  calculateDiscount,
  cleanText,
  saveDealsToMongo,
  getDiscountThreshold,
  getScrapingUrls,
} from "../utils/helpers.js";

dotenv.config();

export async function scrapeAmazon() {
  // Get dynamic threshold from database
  const threshold = await getDiscountThreshold();
  console.log(chalk.blue(`🎯 Using discount threshold: ${threshold}%`));

  const urls = await getScrapingUrls();

  const allProducts = [];

  for (const { url, type, platform } of urls.filter(
    (u) => u.platform === "amazon"
  )) {
    try {
      console.log(chalk.blue(`🔍 Scraping [${type}]: ${url}`));

      const { data: html } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const $ = cheerio.load(html);
      const products = [];

      $("div[data-asin]:has(h2)").each((_, el) => {
        const title = $(el).find("h2 span").text().trim();
        const href = $(el).find("a.a-link-normal").attr("href");
        const link = href?.startsWith("http")
          ? href
          : `https://www.amazon.in${href}`;
        const priceText = $(el)
          .find(".a-price .a-offscreen")
          .first()
          .text()
          .trim();

        // Improved MRP selection - looks for the actual MRP text first
        let mrpText = $(el)
          .find(
            ".a-section.aok-inline-block .a-price.a-text-price .a-offscreen"
          )
          .first()
          .text()
          .trim();

        // Fallback if the above doesn't work
        if (!mrpText) {
          mrpText = $(el)
            .find(".a-price.a-text-price .a-offscreen")
            .last() // Take the last one to avoid per-unit prices
            .text()
            .trim();
        }

        const price = parseInt(cleanText(priceText));
        const mrp = parseInt(cleanText(mrpText));
        const discount = calculateDiscount(price, mrp);
        const imgSrc = $(el).find("img.s-image").attr("src");

        if (title && price && link && discount >= threshold) {
          console.log(
            chalk.green(
              `🔥 DEAL: ${title} — ₹${price} / ₹${mrp} → ${discount}% OFF`
            )
          );

          products.push({
            platform,
            type,
            title,
            price: priceText,
            mrp: mrpText,
            link,
            discount,
            image: imgSrc || "",
            scrapedAt: new Date(),
          });
        }
      });

      console.log(`✅ Found ${products.length} valid deals from: ${url}`);
      allProducts.push(...products);
    } catch (err) {
      console.error(`❌ Amazon Scrape failed for ${url} -`, err.message);
    }
  }

  if (allProducts.length > 0) {
    await saveDealsToMongo(allProducts);
  }

  return allProducts;
}
