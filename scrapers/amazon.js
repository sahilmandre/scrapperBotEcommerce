// scrapers/amazon.js
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import chalk from "chalk";
import {
  calculateDiscount,
  cleanText,
  saveDealsToPlatformFile,
} from "../utils/helpers.js";

import { urls } from "../config/urls.js";

dotenv.config();

const threshold = parseInt(process.env.DISCOUNT_THRESHOLD || "90");

export async function scrapeAmazon() {
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
        const mrpText = $(el)
          .find(".a-price.a-text-price .a-offscreen")
          .first()
          .text()
          .trim();

        const price = parseInt(cleanText(priceText));
        const mrp = parseInt(cleanText(mrpText));
        const discount = calculateDiscount(price, mrp);

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
    saveDealsToPlatformFile("amazon", allProducts);
  }

  return allProducts;
}
