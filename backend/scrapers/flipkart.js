import chalk from "chalk";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import Product from "../models/product.js";
import {
  calculateDiscount,
  cleanText,
  getDiscountThreshold,
  getHeadlessSetting,
  getScrapingUrls,
  extractProductId,
} from "../utils/helpers.js";

dotenv.config();

export async function scrapeFlipkart(pincode) {
  // ✅ Accept pincode
  const threshold = await getDiscountThreshold();
  const headless = await getHeadlessSetting();
  const urls = await getScrapingUrls();

  console.log(
    chalk.blue(`🎯 Flipkart: Using discount threshold: ${threshold}%`)
  );
  console.log(chalk.blue(`🤖 Flipkart: Headless mode: ${headless}`));
  console.log(chalk.blue(`🎯 Flipkart: Using pincode: ${pincode}`)); // Log the pincode

  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  const updatedProducts = [];

  for (const { url, type } of urls.filter((u) => u.platform === "flipkart")) {
    try {
      console.log(chalk.blue(`🔍 Scraping Flipkart [${type}]: ${url}`));
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      const productsOnPage = await page.evaluate(() => {
        const cards = document.querySelectorAll("div[data-id]");
        const items = [];
        cards.forEach((card) => {
          const title = card.querySelector("a.wjcEIp")?.innerText?.trim();
          const productAnchor = card.querySelector("a[href*='/p/']");
          const href = productAnchor?.getAttribute("href");
          const productUrl = href ? "https://www.flipkart.com" + href : null;
          const price = card.querySelector(".Nx9bqj")?.innerText;
          const mrp = card.querySelector(".yRaY8j")?.innerText;
          const image = card.querySelector("img")?.src;
          if (title && price && mrp && productUrl) {
            items.push({ title, price, mrp, productUrl, image });
          }
        });
        return items;
      });

      console.log(
        chalk.gray(
          `🧪 Found ${productsOnPage.length} product entries on Flipkart page.`
        )
      );

      for (const item of productsOnPage) {
        const price = parseInt(cleanText(item.price));
        const mrp = parseInt(cleanText(item.mrp));
        const discount = calculateDiscount(price, mrp);

        if (discount >= threshold) {
          const productId = extractProductId(item.productUrl, "flipkart");
          if (!productId) {
            console.log(
              chalk.yellow(
                `⚠️ Could not extract Flipkart Product ID for: ${item.title}`
              )
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
                    "priceHistory.$.price": item.price,
                    "priceHistory.$.mrp": item.mrp,
                    "priceHistory.$.discount": discount,
                  },
                }
              );
              console.log(
                chalk.magenta(
                  `🔄 Updated to new LOWEST price for: ${item.title}`
                )
              );
            } else {
              console.log(
                chalk.gray(`👍 Kept existing lower price for: ${item.title}`)
              );
            }
          } else {
            const newPriceEntry = {
              price: item.price,
              mrp: item.mrp,
              discount,
              scrapedAt: new Date(),
            };

            const updatedProduct = await Product.findOneAndUpdate(
              { productId: productId },
              {
                $set: {
                  title: item.title,
                  image: item.image || "",
                  link: item.productUrl,
                  platform: "flipkart",
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
      console.error(`❌ Flipkart Scrape failed for ${url} -`, err.message);
    }
  }

  await browser.close();
  return updatedProducts;
}
