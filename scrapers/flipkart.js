// scrapers/flipkart.js
import chalk from "chalk";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { urls } from "../config/urls.js";
import {
  calculateDiscount,
  cleanText,
  saveDealsToMongo,
  saveDealsToPlatformFile,
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
      const anchors = document.querySelectorAll("a.WKTcLC, a.IRpwTa");
      const items = [];

      anchors.forEach((anchor) => {
        const title = anchor?.innerText?.trim();
        const href = anchor?.getAttribute("href");
        const productUrl = href?.startsWith("http")
          ? href
          : "https://www.flipkart.com" + href;

        const price = anchor
          ?.closest(".hCKiGj")
          ?.querySelector(".Nx9bqj")?.innerText;
        const mrp = anchor
          ?.closest(".hCKiGj")
          ?.querySelector(".yRaY8j")?.innerText;

        if (title && price && mrp && href) {
          items.push({ title, price, mrp, productUrl });
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
          productUrl: item.productUrl,
        });
      }
    }
  }

  await browser.close();

  // if (results.length > 0) {
  //   saveDealsToPlatformFile("flipkart", results);
  // }

  // Normalize field for MongoDB
  const cleanedResults = results.map((item) => ({
    ...item,
    link: item.productUrl, // 👈 map Flipkart 'productUrl' to 'link'
  }));

  if (cleanedResults.length > 0) {
    await saveDealsToMongo(cleanedResults);
  }

  return results;
}
