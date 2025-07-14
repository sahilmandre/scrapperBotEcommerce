// scrapers/flipkart.js
import puppeteer from "puppeteer";
import { calculateDiscount, cleanText } from "../utils/helpers.js";
import { urls } from "../config/urls.js";
import fs from "fs";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const threshold = parseInt(process.env.DISCOUNT_THRESHOLD || "90");
const headless = process.env.HEADLESS !== "false";

export async function scrapeFlipkartDeals() {
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  const results = [];

  for (let url of urls) {
    console.log(chalk.blue(`🔍 Scraping: ${url}`));
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  const products = await page.evaluate(() => {
  const cards = document.querySelectorAll("a.WKTcLC, a.IRpwTa"); // New selectors
  const items = [];

  cards.forEach((card) => {
    const title = card?.innerText;
    const price = card
      ?.closest(".hCKiGj")
      ?.querySelector(".Nx9bqj")?.innerText;
    const mrp = card
      ?.closest(".hCKiGj")
      ?.querySelector(".yRaY8j")?.innerText;

    if (title && price && mrp) {
      items.push({ title, price, mrp });
    }
  });

  return items;
});


    console.log(chalk.gray(`🧪 Found ${products.length} product entries`));

    for (let item of products) {
      const price = parseInt(cleanText(item.price));
      const mrp = parseInt(cleanText(item.mrp));
      const discount = calculateDiscount(price, mrp);

      if (!isNaN(discount)) {
        console.log(chalk.gray(`📦 ${item.title} | ₹${price} / ₹${mrp} → ${discount}% off`));
      }

      if (discount >= threshold) {
        console.log(chalk.green(`🔥 DEAL: ${item.title} — ${discount}% OFF`));
        results.push({
          ...item,
          price,
          mrp,
          discount,
          url,
        });
      }
    }
  }

  await browser.close();

  if (results.length > 0) {
    fs.writeFileSync("results/flipkart.json", JSON.stringify(results, null, 2));
    console.log(chalk.yellowBright(`✅ ${results.length} deals saved to results/flipkart.json`));
  } else {
    console.log(chalk.red(`❌ No qualifying deals found.`));
  }
}
