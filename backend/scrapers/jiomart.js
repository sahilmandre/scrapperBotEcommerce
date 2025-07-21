// scrapers/jiomart.js - Fixed version
import chalk from "chalk";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { urls } from "../config/urls.js";
import {
  calculateDiscount,
  cleanText,
  saveDealsToMongo,
  getDiscountThreshold,
  getHeadlessSetting,
} from "../utils/helpers.js";

dotenv.config();

export async function scrapeJiomart() {
  // Get dynamic settings from database
  const threshold = await getDiscountThreshold();
  const headless = await getHeadlessSetting();

  console.log(chalk.blue(`🎯 Using discount threshold: ${threshold}%`));
  console.log(chalk.blue(`🤖 Headless mode: ${headless}`));

  const browser = await puppeteer.launch({ 
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set user agent and viewport to mimic real browser
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.setViewport({ width: 1366, height: 768 });

  const results = [];

  for (let { url, type, platform } of urls.filter(
    (u) => u.platform === "jiomart"
  )) {
    try {
      console.log(chalk.blue(`🔍 Scraping [${type}]: ${url}`));
      
      // Navigate with longer timeout and wait for either network idle or DOM content loaded
      await page.goto(url, { 
        waitUntil: ['domcontentloaded', 'networkidle2'],
        timeout: 30000 
      });

      // Wait for products to load - using more reliable selectors
      await page.waitForSelector('li.ais-InfiniteHits-item', { 
        timeout: 15000,
        visible: true 
      });

      const products = await page.evaluate(() => {
        const productCards = Array.from(document.querySelectorAll('li.ais-InfiniteHits-item'));
        const items = [];

        productCards.forEach((card) => {
          try {
            // Title
            const titleElement = card.querySelector('.plp-card-details-name');
            const title = titleElement?.innerText?.trim();

            // Product link
            const linkElement = card.querySelector('a.plp-card-wrapper');
            const href = linkElement?.getAttribute("href");
            const productUrl = href?.startsWith("http")
              ? href
              : "https://www.jiomart.com" + href;

            // Current price
            const priceElement = card.querySelector('.plp-card-details-price > span.jm-heading-xxs');
            const price = priceElement?.innerText?.trim();

            // MRP
            const mrpElement = card.querySelector('.plp-card-details-price > span.line-through');
            const mrp = mrpElement?.innerText?.trim();

            // Image
            const imgElement = card.querySelector('img.lazyautosizes');
            const image = imgElement?.src || imgElement?.getAttribute('data-src') || '';

            // Only add if we have essential data
            if (title && price && productUrl) {
              items.push({ 
                title, 
                price, 
                mrp: mrp || price, // Use price as fallback if no MRP
                productUrl, 
                image 
              });
            }
          } catch (error) {
            console.error('Error parsing product card:', error);
          }
        });

        return items;
      });

      console.log(`✅ Found ${products.length} products from: ${url}`);

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

          if (discount >= threshold && discount > 0) {
            console.log(chalk.green(`🔥 DEAL: ${item.title} — ${discount}% OFF`));
            results.push({
              platform: "jiomart",
              type,
              title: item.title,
              price: item.price,
              mrp: item.mrp,
              discount,
              link: item.productUrl,
              image: item.image,
              scrapedAt: new Date(),
            });
          }
        }
      }

      // Wait between requests to be respectful
      await page.waitForTimeout(1000);

    } catch (error) {
      console.error(`❌ JioMart Scrape failed for ${url} -`, error.message);
      // Continue with next URL instead of failing completely
      continue;
    }
  }

  await browser.close();

  if (results.length > 0) {
    await saveDealsToMongo(results);
  }

  console.log(chalk.green(`✅ JioMart scraping completed. Found ${results.length} deals.`));
  return results;
};