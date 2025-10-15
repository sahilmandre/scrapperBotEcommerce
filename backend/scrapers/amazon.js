// backend/scrapers/amazon.js
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function scrapeAmazon(pincode) {
  const threshold = await getDiscountThreshold();
  const headless = await getHeadlessSetting();
  const urls = await getScrapingUrls();

  console.log(chalk.blue(`🎯 Amazon: Using discount threshold: ${threshold}%`));
  console.log(chalk.blue(`🎯 Amazon: Using pincode: ${pincode}`));

  const updatedProducts = [];
  const maxPages = 2;

  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  try {
    // --- Set Pincode Logic ---
    console.log(chalk.yellow("🔧 Amazon: Setting delivery pincode..."));
    await page.goto("https://www.amazon.in", { waitUntil: "networkidle2" });

    await page.waitForSelector("#nav-global-location-popover-link");
    await page.click("#nav-global-location-popover-link");

    await page.waitForSelector("#GLUXZipUpdateInput");
    await page.type("#GLUXZipUpdateInput", pincode);
    await delay(500);
    await page.click("#GLUXZipUpdate-announce");

    await page.waitForFunction(
      () => !document.querySelector("#GLUXZipUpdateInput")
    );
    await delay(2000);
    console.log(chalk.green(`✅ Amazon: Pincode set to ${pincode}`));
    // --- End Pincode Logic ---

    for (const { url, type } of urls.filter((u) => u.platform === "amazon")) {
      console.log(
        chalk.blue(`🔍 Scraping Amazon [${type}] (Page 1): ${url}&page=1`)
      );
      await page.goto(`${url}&page=1`, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      for (let i = 1; i <= maxPages; i++) {
        let productsOnPage = [];
        try {
          if (i > 1) {
            console.log(chalk.blue(`🔍 Scraping Amazon [${type}] (Page ${i})`));
          }

          await page.waitForSelector("div[data-asin]:has(h2)", {
            timeout: 20000,
          });

          productsOnPage = await page.evaluate(() => {
            const items = [];
            // ✅ FIX: Using the proven selectors from your working axios version.
            document
              .querySelectorAll("div[data-asin]:has(h2)")
              .forEach((el) => {
                const href = el
                  .querySelector("a.a-link-normal")
                  ?.getAttribute("href");

                // Basic validation to skip non-product elements
                if (
                  !href ||
                  href === "#" ||
                  (!href.includes("/dp/") && !href.startsWith("/sspa/click"))
                ) {
                  return;
                }

                const title = el.querySelector("h2 span")?.innerText?.trim();
                const priceText = el
                  .querySelector(".a-price .a-offscreen")
                  ?.innerText?.trim();

                // Replicating the multi-step MRP logic
                let mrpText = el
                  .querySelector(
                    ".a-section.aok-inline-block .a-price.a-text-price .a-offscreen"
                  )
                  ?.innerText?.trim();
                if (!mrpText) {
                  mrpText = el
                    .querySelector(".a-price.a-text-price .a-offscreen")
                    ?.innerText?.trim();
                }

                const imgSrc = el
                  .querySelector("img.s-image")
                  ?.getAttribute("src");

                if (title && href && priceText) {
                  items.push({ title, href, priceText, mrpText, imgSrc });
                }
              });
            return items;
          });
        } catch (pageError) {
          console.log(
            chalk.red(
              `❌ Error finding products on page ${i} for [${type}]: ${pageError.message}`
            )
          );
          break;
        }

        if (productsOnPage.length === 0) {
          console.log(
            chalk.yellow(
              `⚠️ No results found for [${type}] on page ${i}. Moving to next category.`
            )
          );
          break;
        }

        console.log(
          chalk.gray(`Found ${productsOnPage.length} products on page ${i}.`)
        );

        for (const item of productsOnPage) {
          const link = `https://www.amazon.in${item.href}`;
          const price = parseInt(cleanText(item.priceText));
          const mrp = item.mrpText ? parseInt(cleanText(item.mrpText)) : price;
          const discount = calculateDiscount(price, mrp);

          if (item.title && price && link && discount >= threshold) {
            const productId = extractProductId(link, "amazon");
            if (!productId) continue;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const product = await Product.findOne({
              productId: productId,
              "priceHistory.scrapedAt": { $gte: today },
            });

            if (product) {
              // Logic to update price if a lower one is found
            } else {
              const newPriceEntry = {
                price: item.priceText,
                mrp: item.mrpText || item.priceText,
                discount,
                scrapedAt: new Date(),
              };
              const updatedProduct = await Product.findOneAndUpdate(
                { productId: productId },
                {
                  $set: {
                    title: item.title,
                    image: item.imgSrc || "",
                    link,
                    platform: "amazon",
                  },
                  $setOnInsert: { type: type },
                  $push: {
                    priceHistory: { $each: [newPriceEntry], $slice: -90 },
                  },
                },
                { upsert: true, new: true }
              );
              console.log(
                chalk.green(
                  `✅ Added new daily price for: ${updatedProduct.title.substring(
                    0,
                    30
                  )}... | Discount: ${discount}%`
                )
              );
              updatedProducts.push(updatedProduct);
            }
          }
        }

        // ✅ DEFINITIVE FIX FOR PAGINATION
        if (i < maxPages) {
          const nextButtonIsDisabled = await page.$(
            "span.s-pagination-item.s-pagination-next.s-pagination-disabled"
          );
          if (nextButtonIsDisabled) {
            console.log(
              chalk.yellow(
                "End of results for this category (Next button is disabled)."
              )
            );
            break;
          }

          const nextButtonSelector = "a.s-pagination-item.s-pagination-next";
          const nextButton = await page.$(nextButtonSelector);
          if (nextButton) {
            console.log(chalk.gray("Navigating to next page..."));
            await page.click(nextButtonSelector);
            // After clicking, simply wait for the new results to render.
            await page.waitForSelector("div[data-asin]:has(h2)", {
              timeout: 20000,
            });
            await delay(1500); // Small extra delay for any final rendering.
          } else {
            console.log(
              chalk.yellow(
                'Could not find clickable "Next" button. End of results.'
              )
            );
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error(`❌ Amazon Scrape failed -`, err.message);
  } finally {
    await browser.close();
  }

  return updatedProducts;
}
