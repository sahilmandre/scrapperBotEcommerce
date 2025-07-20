// scrapers/flipkart.js
import chalk from "chalk";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { urls } from "../config/urls.js";
import {
  calculateDiscount,
  cleanText,
  saveDealsToMongo,
} from "../utils/helpers.js";

dotenv.config();

const threshold = parseInt(process.env.DISCOUNT_THRESHOLD || "90");
const headless = process.env.HEADLESS !== "false";

export async function scrapeFlipkart() {
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  const results = [];

  for (let { url, type, platform } of urls.filter(
    (u) => u.platform === "flipkart"
  )) {
    console.log(chalk.blue(`🔍 Scraping [${type}]: ${url}`));
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const products = await page.evaluate(() => {
      const cards = document.querySelectorAll("div[data-id]"); // Each product card
      const items = [];

      cards.forEach((card) => {
        const anchor = card.querySelector("a.WKTcLC, a.IRpwTa");
        const title = anchor?.innerText?.trim();

        const href = anchor?.getAttribute("href");
        const productUrl = href?.startsWith("http")
          ? href
          : "https://www.flipkart.com" + href;

        const price = card.querySelector(".Nx9bqj")?.innerText;
        const mrp = card.querySelector(".yRaY8j")?.innerText;

        // ✅ Image logic: inside .wvIX4U → .gqcSqV → img
        const imgTag = card.querySelector("div.wvIX4U img");
        const image = imgTag?.src?.includes("rukminim2.flixcart.com")
          ? imgTag.src
          : "";

        if (title && price && mrp && productUrl) {
          items.push({ title, price, mrp, productUrl, image });
        }
      });

      return items;
    });

    console.log(`🔍 Scraping ${platform.toUpperCase()} [${type}] → ${url}`);
    console.log(chalk.gray(`🧪 Found ${products.length} product entries`));

    for (let item of products) {
      const price = parseInt(cleanText(item.price));
      const mrp = parseInt(cleanText(item.mrp));
      const discount = calculateDiscount(price, mrp);

      if (!isNaN(discount)) {
        console.log(
          chalk.gray(
            `📦 ${item.title} | ₹${price} / ₹${mrp} → ${discount}% off`
          )
        );
      }

      if (discount >= threshold) {
        console.log(chalk.green(`🔥 DEAL: ${item.title} — ${discount}% OFF`));
        results.push({
          platform: "flipkart",
          type,
          title: item.title,
          price,
          mrp,
          discount,
          link: item.productUrl,
          image: item.image, // ✅ include image in final result
          scrapedAt: new Date(),
        });
      }
    }
  }

  await browser.close();

  if (results.length > 0) {
    await saveDealsToMongo(results); // 👈 Save directly, image included
  }

  return results;
}
