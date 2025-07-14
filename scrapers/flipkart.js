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
    const typeMatch = url.match(/q=([^&]+)/);
    const type = typeMatch ? decodeURIComponent(typeMatch[1]) : "unknown";

    console.log(chalk.blue(`🔍 Scraping: ${url}`));
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
          title: item.title,
          price,
          mrp,
          discount,
          productUrl: item.productUrl,
          type, // ✅ add this!
        });
      }
    }
  }

  await browser.close();

  if (results.length > 0) {
    fs.writeFileSync("results/flipkart.json", JSON.stringify(results, null, 2));
    console.log(
      chalk.yellowBright(
        `✅ ${results.length} deals saved to results/flipkart.json`
      )
    );
  } else {
    console.log(chalk.red(`❌ No qualifying deals found.`));
  }
}
