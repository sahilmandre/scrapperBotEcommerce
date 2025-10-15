// backend/scrapers/jiomart.js
import axios from "axios";
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

// Use environment variables for API keys
const ALGOLIA_APP_ID = process.env.JIOMART_ALGOLIA_APP_ID || "3YP0HP3WSH";
const ALGOLIA_API_KEY = process.env.JIOMART_ALGOLIA_API_KEY || "aace3f18430a49e185d2c1111602e4b1";
const ALGOLIA_INDEX_NAME = "prod_mart_master_vertical";

// ✅ FALLBACK COOKIE: As requested, this will be used if the browser method fails.
const FALLBACK_COOKIE = "_ALGOLIA=anonymous-86d6a5b8-2768-4b96-b22d-bf5e877de7ab; _fbp=fb.1.1753271627749.2060927208; WZRK_G=6d8b42882592406da5334f3cee1e51b7; _gcl_au=1.1.1215000745.1753271628; _ga=GA1.1.97660962.1753271628; nms_mgo_city=Indore; nms_mgo_state_code=MP; AKA_A2=A; nms_mgo_pincode=452005; __tr_luptv=1760523199299; _ga_XHR9Q2M3VV=GS2.1.s1760522588$o10$g1$t1760523226$j33$l0$h1705809929; RT=\"z=1&dm=www.jiomart.com&si=7e32b093-82d7-4971-9c08-6577c83323b2&ss=mgrti8e5&sl=2&tt=6qn4&obo=1&rl=1\"; WZRK_S_88R-W4Z-495Z=%7B%22p%22%3A3%2C%22s%22%3A1760522588%2C%22t%22%3A1760523227%7D";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJioMartCookiesWithBrowser(pincode, headless) {
    console.log(chalk.yellow("🔧 JioMart: Launching browser to set pincode and get cookies..."));
    const browser = await puppeteer.launch({ 
        headless,
        args: ['--disable-notifications', '--deny-permission-prompts'] 
    });
    const page = await browser.newPage();
    try {
        await page.goto("https://www.jiomart.com", { waitUntil: "networkidle2" });

        try {
            await page.waitForSelector('#btn_location_close_icon', { timeout: 10000 });
            await page.click('#btn_location_close_icon');
            console.log(chalk.gray("Closed the 'Enable Location' popup."));
        } catch (e) {
            console.log(chalk.gray("Location popup did not appear, proceeding..."));
        }

        console.log(chalk.gray("Waiting for pincode modal to appear..."));
        await page.waitForSelector('#rel_pincode', { visible: true, timeout: 15000 });
        
        await page.type('#rel_pincode', pincode);
        await page.click('#btn_pincode_submit');
        
        await page.waitForFunction(() => !document.querySelector('#rel_pincode'), { timeout: 10000 });
        console.log(chalk.green(`✅ JioMart: Pincode ${pincode} applied.`));
        await delay(1000);

        const cookies = await page.cookies();
        console.log(chalk.green("✅ JioMart: Cookies retrieved successfully."));
        return cookies.map(c => `${c.name}=${c.value}`).join('; ');
    } catch (error) {
        console.error(chalk.red("❌ Failed to get JioMart cookies using browser:"), error.message);
        throw error; 
    } finally {
        if(browser) await browser.close();
    }
}

export async function scrapeJiomart(pincode) {
    const threshold = await getDiscountThreshold();
    const headless = await getHeadlessSetting();
    const urls = await getScrapingUrls();
    console.log(chalk.blue(`🎯 JioMart: Using discount threshold: ${threshold}%`));
    console.log(chalk.blue(`🎯 JioMart: Using pincode: ${pincode}`));

    const updatedProducts = [];
    let cookieHeader;

    try {
        // ✅ ATTEMPT 1: Try getting fresh cookies using the browser
        cookieHeader = await getJioMartCookiesWithBrowser(pincode, headless);
    } catch (err) {
        // ✅ ATTEMPT 2: If browser fails, use the hardcoded fallback
        console.log(chalk.yellow("⚠️ Browser method failed. Using fallback cookie."));
        cookieHeader = FALLBACK_COOKIE;
    }

    if (!cookieHeader) {
        console.error(chalk.red("❌ Critical Error: Could not obtain cookies for JioMart. Aborting scrape."));
        return updatedProducts;
    }

    try {
        for (const { url, type } of urls.filter((u) => u.platform === "jiomart")) {
            try {
                const searchQuery = new URL(url).pathname.split("/search/")[1];
                if (!searchQuery) continue;
                
                console.log(chalk.blue(`🔍 Scraping JioMart [${type}] via API: ${searchQuery}`));
                
                const response = await axios.post(
                    `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`,
                    {
                        requests: [{
                            indexName: ALGOLIA_INDEX_NAME,
                            params: `query=${decodeURIComponent(searchQuery)}&hitsPerPage=50&facets=["*"]&facetFilters=[["category_tree.level0:Category"]]`
                        }],
                    },
                    { headers: {
                        "Content-Type": "application/json",
                        "X-Algolia-Application-Id": ALGOLIA_APP_ID,
                        "X-Algolia-API-Key": ALGOLIA_API_KEY,
                        "Cookie": cookieHeader 
                    }}
                );

                const hits = response.data.results[0]?.hits || [];
                if(hits.length === 0) {
                    console.log(chalk.gray(`🧪 No product entries found from JioMart API for ${type}.`));
                    continue;
                }

                console.log(chalk.gray(`🧪 Found ${hits.length} product entries from JioMart API.`));

                for (const hit of hits) {
                    const sellerData =
                      hit.buybox_mrp?.PANINDIAFASHION ||
                      hit.buybox_mrp?.PANINDIAGROCERIES ||
                      hit.buybox_mrp?.PANINDIAHOMEANDKITCHEN ||
                      (hit.seller_wise_mrp &&
                        Object.values(hit.seller_wise_mrp)[0]?.[
                          Object.keys(Object.values(hit.seller_wise_mrp)[0])[0]
                        ]) ||
                      null;

                    if (!sellerData) continue;
                    
                    const price = sellerData.price || 0;
                    const mrp = sellerData.mrp || price;
                    const discount = calculateDiscount(price, mrp);
                    
                    if (discount >= threshold) {
                        const link = `https://www.jiomart.com${hit.url_path}`;
                        const productId = extractProductId(link, "jiomart");
                        if (!productId) continue;

                        const priceText = `₹${price}`;
                        const mrpText = `₹${mrp}`;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const product = await Product.findOne({
                            productId: productId,
                            "priceHistory.scrapedAt": { $gte: today },
                        });

                        if (product) {
                            const todaysEntry = product.priceHistory.find(
                                (h) => new Date(h.scrapedAt) >= today
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
                                    chalk.magenta(
                                        `🔄 Updated to new LOWEST price for: ${hit.display_name}`
                                    )
                                );
                            }
                        } else {
                            const newPriceEntry = { price: priceText, mrp: mrpText, discount, scrapedAt: new Date() };
                            const updatedProduct = await Product.findOneAndUpdate(
                                { productId: productId },
                                {
                                    $set: {
                                        title: hit.display_name,
                                        image: `https://www.jiomart.com/images/product/original/${hit.image_path}`,
                                        link: link,
                                        platform: "jiomart",
                                    },
                                    $setOnInsert: { type: type },
                                    $push: { priceHistory: { $each: [newPriceEntry], $slice: -90 } },
                                },
                                { upsert: true, new: true }
                            );
                            console.log(chalk.green(`✅ Added new deal for: ${updatedProduct.title.substring(0, 40)}... | ${discount}% off`));
                            updatedProducts.push(updatedProduct);
                        }
                    }
                }
            } catch (err) {
                console.error(`❌ JioMart API scrape failed for ${url} -`, err.message);
            }
        }
    } catch (err) {
        console.error(`❌ Failed to complete JioMart scrape -`, err.message);
    }
    
    return updatedProducts;
}

