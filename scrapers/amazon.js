// scrapers/amazon.js
import axios from "axios";
import * as cheerio from "cheerio";
import { calculateDiscount } from "../utils/helpers.js";

import { urls } from "../config/urls.js";

export async function scrapeAmazon() {
  const allProducts = [];
  for (const { url, type, platform } of urls.filter(
    (u) => u.platform === "amazon"
  )) {
    console.log("🔍 Scraping:", url);

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
      const price = $(el).find(".a-price .a-offscreen").first().text().trim();
      const mrp = $(el)
        .find(".a-price.a-text-price .a-offscreen")
        .first()
        .text()
        .trim();
      const priceNum = parseInt(price.replace(/[₹,]/g, ""));
      const mrpNum = parseInt(mrp.replace(/[₹,]/g, ""));
      const discount = calculateDiscount(priceNum, mrpNum);

      if (title && price && link) {
        products.push({
          platform,
          type,
          title,
          price,
          mrp,
          link,
          discount,
        });
      }
    });

    console.log(`✅ Found ${products.length} products from: ${url}`);
    allProducts.push(...products);
  }

  return allProducts;
}
