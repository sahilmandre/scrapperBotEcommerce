import axios from "axios";
import chalk from "chalk";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import Product from "../models/product.js";
import {
  calculateDiscount,
  cleanText,
  getDiscountThreshold,
  getScrapingUrls,
  extractProductId,
} from "../utils/helpers.js";

dotenv.config();

export async function scrapeAmazon() {
  const threshold = await getDiscountThreshold();
  const urls = await getScrapingUrls();
  console.log(chalk.blue(`🎯 Amazon: Using discount threshold: ${threshold}%`));

  const updatedProducts = [];

  for (const { url, type } of urls.filter((u) => u.platform === "amazon")) {
    try {
      console.log(chalk.blue(`🔍 Scraping Amazon [${type}]: ${url}`));

      const { data: html } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const $ = cheerio.load(html);

      for (const el of $("div[data-asin]:has(h2)")) {
        const href = $(el).find("a.a-link-normal").attr("href");

        // ✅ ADDED CHECK: Ignore elements with invalid or non-product links
        if (!href || href === "#" || !href.includes("/dp/")) {
          continue; // Skip this element and move to the next one
        }

        const title = $(el).find("h2 span").text().trim();
        const link = href.startsWith("http")
          ? href
          : `https://www.amazon.in${href}`;

        const priceText = $(el)
          .find(".a-price .a-offscreen")
          .first()
          .text()
          .trim();
        let mrpText = $(el)
          .find(
            ".a-section.aok-inline-block .a-price.a-text-price .a-offscreen"
          )
          .first()
          .text()
          .trim();
        if (!mrpText) {
          mrpText = $(el)
            .find(".a-price.a-text-price .a-offscreen")
            .last()
            .text()
            .trim();
        }

        const price = parseInt(cleanText(priceText));
        const mrp = parseInt(cleanText(mrpText));
        const discount = calculateDiscount(price, mrp);
        const imgSrc = $(el).find("img.s-image").attr("src");

        if (title && price && link && discount >= threshold) {
          const productId = extractProductId(link, "amazon");
          if (!productId) {
            console.log(
              chalk.yellow(`⚠️ Could not extract Product ID for: ${title}`)
            );
            continue;
          }

          const newPriceEntry = {
            price: priceText,
            mrp: mrpText,
            discount,
            scrapedAt: new Date(),
          };

          const updatedProduct = await Product.findOneAndUpdate(
            { productId: productId },
            {
              $set: {
                title,
                image: imgSrc || "",
                link,
                platform: "amazon",
              },
              $push: {
                priceHistory: {
                  $each: [newPriceEntry],
                  $slice: -90,
                },
              },
            },
            {
              upsert: true,
              new: true,
            }
          );

          console.log(chalk.green(`✅ Updated/Added: ${updatedProduct.title}`));
          updatedProducts.push(updatedProduct);
        }
      }
    } catch (err) {
      console.error(`❌ Amazon Scrape failed for ${url} -`, err.message);
    }
  }

  return updatedProducts;
}
