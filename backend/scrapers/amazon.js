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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/108.0",
];

export async function scrapeAmazon(pincode) {
  // ✅ Accept pincode
  const threshold = await getDiscountThreshold();
  const urls = await getScrapingUrls();
  console.log(chalk.blue(`🎯 Amazon: Using discount threshold: ${threshold}%`));
  console.log(chalk.blue(`🎯 Amazon: Using pincode: ${pincode}`)); // Log the pincode

  const updatedProducts = [];
  const maxPages = 2;

  for (const { url, type } of urls.filter((u) => u.platform === "amazon")) {
    for (let page = 1; page <= maxPages; page++) {
      try {
        const pageUrl = `${url}&page=${page}`;
        console.log(
          chalk.blue(`🔍 Scraping Amazon [${type}] (Page ${page}): ${pageUrl}`)
        );

        // ✅ Select a random User-Agent for this request
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        console.log(chalk.gray(`Using User-Agent: ${randomUserAgent}`));

        const { data: html } = await axios.get(pageUrl, {
          headers: {
            "User-Agent": randomUserAgent,
            "Accept-Language": "en-US,en;q=0.9",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            Referer: "https://www.amazon.in/",
            DNT: "1",
          },
        });

        const $ = cheerio.load(html);

        if ($("div[data-asin]").length === 0) {
          console.log(
            chalk.yellow(
              `⚠️ No more results found for [${type}] on page ${page}. Moving to next category.`
            )
          );
          break;
        }

        for (const el of $("div[data-asin]:has(h2)")) {
          const href = $(el).find("a.a-link-normal").attr("href");

          if (
            !href ||
            href === "#" ||
            (!href.includes("/dp/") && !href.startsWith("/sspa/click"))
          )
            continue;

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
          if (!mrpText)
            mrpText = $(el)
              .find(".a-price.a-text-price .a-offscreen")
              .last()
              .text()
              .trim();

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

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const product = await Product.findOne({
              productId: productId,
              "priceHistory.scrapedAt": { $gte: today },
            });

            if (product) {
              const todaysEntry = product.priceHistory.find(
                (h) => h.scrapedAt >= today
              );
              const existingPrice = parseFloat(cleanText(todaysEntry.price));

              if (price < existingPrice) {
                await Product.updateOne(
                  { "priceHistory._id": todaysEntry._id },
                  {
                    $set: {
                      "priceHistory.$.price": priceText,
                      "priceHistory.$.mrp": mrpText,
                      "priceHistory.$.discount": discount,
                    },
                  }
                );
                console.log(
                  chalk.magenta(`🔄 Updated to new LOWEST price for: ${title}`)
                );
              }
            } else {
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
                  $setOnInsert: { type: type },
                  $push: {
                    priceHistory: {
                      $each: [newPriceEntry],
                      $slice: -90,
                    },
                  },
                },
                { upsert: true, new: true }
              );

              console.log(
                chalk.green(
                  `✅ Added new daily price for: ${updatedProduct.title}`
                )
              );
              updatedProducts.push(updatedProduct);
            }
          }
        }
      } catch (err) {
        console.error(
          `❌ Amazon Scrape failed for ${url} on page ${page} -`,
          err.message
        );
      }

      if (page < maxPages) {
        const randomDelay = Math.floor(Math.random() * 3000) + 2000;
        console.log(
          chalk.gray(
            `Waiting for ${randomDelay / 1000} seconds before next page...`
          )
        );
        await delay(randomDelay);
      }
    }
  }
  return updatedProducts;
}
