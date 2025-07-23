import chalk from "chalk";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import Product from "../models/product.js"; // Using the new Product model
import {
  calculateDiscount,
  cleanText,
  getDiscountThreshold,
  getHeadlessSetting,
  getScrapingUrls,
  extractProductId,
} from "../utils/helpers.js";

dotenv.config();

export async function scrapeFlipkart() {
  const threshold = await getDiscountThreshold();
  const headless = await getHeadlessSetting();
  const urls = await getScrapingUrls();

  console.log(
    chalk.blue(`🎯 Flipkart: Using discount threshold: ${threshold}%`)
  );
  console.log(chalk.blue(`🤖 Flipkart: Headless mode: ${headless}`));

  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  const updatedProducts = [];

  for (const { url, type } of urls.filter((u) => u.platform === "flipkart")) {
    try {
      console.log(chalk.blue(`🔍 Scraping Flipkart [${type}]: ${url}`));
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      // ✅ Using the proven selectors from your working version
      const productsOnPage = await page.evaluate(() => {
        const cards = document.querySelectorAll("div[data-id]");
        const items = [];
        cards.forEach((card) => {
          const titleAnchor = card.querySelector("a.wjcEIp");
          const title = titleAnchor?.innerText?.trim();

          const productAnchor = card.querySelector("a[href*='/p/']");
          const href = productAnchor?.getAttribute("href");
          const productUrl = href ? "https://www.flipkart.com" + href : null;

          const price = card.querySelector(".Nx9bqj")?.innerText;
          const mrp = card.querySelector(".yRaY8j")?.innerText;

          const imgTag = card.querySelector("img");
          const image = imgTag?.src;

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
            chalk.green(`✅ Updated/Added Flipkart: ${updatedProduct.title}`)
          );
          updatedProducts.push(updatedProduct);
        }
      }
    } catch (err) {
      console.error(`❌ Flipkart Scrape failed for ${url} -`, err.message);
    }
  }

  await browser.close();
  return updatedProducts;
}
