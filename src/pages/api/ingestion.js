// // pages/api/scrape.js
// import fs from "fs/promises";
// import path from "path";
// import * as cheerio from "cheerio";
// import * as xml2js from "xml2js";

// const DEFAULT_USER_AGENT =
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// async function fetchWithRetry(url, options = {}, retries = 2, backoff = 500) {
//     try {
//         const res = await fetch(url, {
//             headers: {
//                 "User-Agent": DEFAULT_USER_AGENT,
//                 Accept: "text/html,application/xhtml+xml,application/xml",
//                 ...options.headers,
//             },
//             timeout: options.timeout || 15000,
//         });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const text = await res.text();
//         return { text, headers: Object.fromEntries(res.headers.entries()) };
//     } catch (err) {
//         if (retries > 0) {
//             await new Promise((r) => setTimeout(r, backoff));
//             return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
//         }
//         throw err;
//     }
// }

// function cleanText(txt) {
//     // normalize whitespace and trim
//     return txt.replace(/\s+/g, " ").trim();
// }

// function extractFromHtml(html, url) {
//     const $ = cheerio.load(html);

//     // remove boilerplate
//     $("script, style, nav, header, footer, noscript, iframe, form").remove();

//     // remove common unwanted selectors (ads / cookie banners) aggressively
//     const unwanted = [
//         '[class*="ads"]',
//         '[id*="ads"]',
//         '[class*="advert"]',
//         '[class*="cookie"]',
//         '[id*="cookie"]',
//         '[class*="banner"]',
//         '[id*="banner"]',
//     ];
//     unwanted.forEach((s) => $(s).remove());

//     // Title
//     const title =
//         $("h1").first().text().trim() ||
//         $("title").first().text().trim() ||
//         $("meta[property='og:title']").attr("content") ||
//         "";

//     // Meta description
//     const metaDesc =
//         $("meta[name='description']").attr("content") ||
//         $("meta[property='og:description']").attr("content") ||
//         "";

//     // Try to find a main content container (several fallbacks)
//     const candidates = [
//         "article",
//         "main",
//         "[role='main']",
//         ".post",
//         ".blog-post",
//         ".article",
//         ".content",
//         "#content",
//         "div[id*='content']",
//         "div[class*='content']",
//         "section",
//     ];

//     let extractedText = "";
//     for (const sel of candidates) {
//         const el = $(sel).first();
//         if (el && el.length) {
//             const txt = cleanText(el.text() || "");
//             if (txt && txt.length > 50) {
//                 extractedText = txt;
//                 break;
//             }
//         }
//     }

//     // fallback to body text if nothing meaningful found
//     if (!extractedText) {
//         extractedText = cleanText($("body").text() || "");
//     }

//     // ensure we don't return empty string
//     if (!extractedText) {
//         extractedText = `NO_TEXT_EXTRACTED_FROM_PAGE - URL: ${url}`;
//     }

//     // collect internal links (optional)
//     const links = [];
//     $("a[href]").each((i, el) => {
//         const href = $(el).attr("href");
//         if (href && typeof href === "string") links.push(href);
//     });

//     return {
//         url,
//         title: title || null,
//         meta_description: metaDesc || null,
//         extracted_text: extractedText,
//         text_preview: extractedText.slice(0, 400),
//         links_count: links.length,
//     };
// }

// async function parseSitemap(sitemapUrl) {
//     const { text } = await fetchWithRetry(sitemapUrl, {}, 2);
//     const parsed = await xml2js.parseStringPromise(text).catch(() => null);
//     if (!parsed) return [];
//     // handle <urlset><url><loc>....
//     const urls =
//         (parsed.urlset && parsed.urlset.url
//             ? parsed.urlset.url.map((u) => u.loc && u.loc[0]).filter(Boolean)
//             : []) || [];
//     return urls;
// }

// export default async function handler(req, res) {
//     if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

//     try {
//         const body = req.body || {};
//         const { sitemapUrl, url, maxPages = 20, limit = 10 } = body;

//         // build list of target URLs
//         let targetUrls = [];
//         if (sitemapUrl) {
//             console.log("🔎 Parsing sitemap:", sitemapUrl);
//             const sitemapUrls = await parseSitemap(sitemapUrl);
//             console.log(`🔗 Found ${sitemapUrls.length} URLs in sitemap`);
//             targetUrls = sitemapUrls.slice(0, Math.min(sitemapUrls.length, maxPages));
//         } else if (url) {
//             targetUrls = [url];
//         } else {
//             return res.status(400).json({ error: "Provide sitemapUrl or url in POST body" });
//         }

//         // safety cap
//         if (limit && targetUrls.length > limit) targetUrls = targetUrls.slice(0, limit);

//         console.log(`🧭 Will scrape ${targetUrls.length} pages (limit=${limit})`);

//         const scraped = [];

//         // fetch pages concurrently but with limited parallelism to be friendlier to site
//         const CONCURRENCY = 5;
//         let idx = 0;

//         async function worker() {
//             while (idx < targetUrls.length) {
//                 const i = idx++;
//                 const pageUrl = targetUrls[i];
//                 console.log(`🌐 [${i + 1}/${targetUrls.length}] Fetching: ${pageUrl}`);
//                 try {
//                     const { text: html, headers } = await fetchWithRetry(pageUrl, {}, 2);
//                     const item = extractFromHtml(html, pageUrl);
//                     item.content_type = headers["content-type"] || "text/html";
//                     scraped.push(item);
//                     console.log(`✅ [${i + 1}] Scraped: ${pageUrl} (chars=${item.extracted_text.length})`);
//                 } catch (err) {
//                     console.error(`❌ [${i + 1}] Failed ${pageUrl}:`, err.message);
//                     scraped.push({
//                         url: pageUrl,
//                         title: null,
//                         meta_description: null,
//                         extracted_text: "",
//                         error: err.message,
//                     });
//                 }
//             }
//         }

//         // start workers
//         await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targetUrls.length) }, worker));

//         // save to public/data/scraped_data.json
//         const outDir = path.join(process.cwd(), "public", "data");
//         await fs.mkdir(outDir, { recursive: true });
//         const outPath = path.join(outDir, "scraped_data.json");
//         await fs.writeFile(outPath, JSON.stringify({ generated_at: new Date().toISOString(), scraped }, null, 2), "utf-8");
//         console.log("💾 Saved scraped_data.json to /public/data");

//         return res.status(200).json({
//             message: "Scraping complete",
//             scraped_count: scraped.length,
//             file: "/data/scraped_data.json",
//             preview: scraped.slice(0, 2),
//         });
//     } catch (err) {
//         console.error("🔥 Error in scrape handler:", err);
//         return res.status(500).json({ error: err.message });
//     }
// }





// import fs from "fs/promises";
// import path from "path";
// import * as xml2js from "xml2js";
// import puppeteer from "puppeteer";

// async function parseSitemap(sitemapUrl) {
//     const res = await fetch(sitemapUrl);
//     const xml = await res.text();
//     const parsed = await xml2js.parseStringPromise(xml);
//     const urls = parsed.urlset.url.map((u) => u.loc[0]).filter(Boolean);
//     return urls;
// }

// async function scrapeWithPuppeteer(urls, limit = 10) {
//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     const scrapedData = [];

//     for (let i = 0; i < Math.min(urls.length, limit); i++) {
//         const url = urls[i];
//         console.log(`🧭 Scraping ${i + 1}/${urls.length}: ${url}`);

//         try {
//             await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
//             const text = await page.evaluate(() => document.body.innerText);
//             const title = await page.title();

//             scrapedData.push({
//                 url,
//                 title,
//                 extracted_text: text.trim().slice(0, 2000), // shorten preview
//             });

//             console.log(`✅ Done: ${url} (${text.length} chars)`);
//         } catch (err) {
//             console.error(`❌ Error scraping ${url}: ${err.message}`);
//             scrapedData.push({ url, error: err.message });
//         }
//     }

//     await browser.close();
//     return scrapedData;
// }

// export default async function handler(req, res) {
//     if (req.method !== "POST")
//         return res.status(405).json({ error: "Method not allowed" });

//     const { sitemapUrl = "https://www.zibtek.com/sitemap.xml", limit = 10 } =
//         req.body || {};

//     try {
//         console.log(`🔍 Fetching sitemap: ${sitemapUrl}`);
//         const urls = await parseSitemap(sitemapUrl);
//         console.log(`📦 Found ${urls.length} URLs in sitemap`);

//         const scraped = await scrapeWithPuppeteer(urls, limit);

//         const outDir = path.join(process.cwd(), "public", "data");
//         await fs.mkdir(outDir, { recursive: true });
//         const outPath = path.join(outDir, "scraped_data.json");
//         await fs.writeFile(
//             outPath,
//             JSON.stringify(
//                 { generated_at: new Date().toISOString(), scraped },
//                 null,
//                 2
//             ),
//             "utf-8"
//         );

//         console.log("💾 Data saved to public/data/scraped_data.json");

//         res.status(200).json({
//             message: "✅ Scraping completed",
//             total: scraped.length,
//             file: "/data/scraped_data.json",
//             preview: scraped.slice(0, 2),
//         });
//     } catch (err) {
//         console.error("🔥 Error in scraper:", err);
//         res.status(500).json({ error: err.message });
//     }
// }



















// import fs from "fs";
// import path from "path";
// import puppeteer from "puppeteer";
// import axios from "axios";
// import { parseStringPromise } from "xml2js";

// // Scroll helper to load lazy content
// async function autoScroll(page) {
//     await page.evaluate(async () => {
//         await new Promise((resolve) => {
//             let totalHeight = 0;
//             const distance = 100;
//             const timer = setInterval(() => {
//                 const scrollHeight = document.body.scrollHeight;
//                 window.scrollBy(0, distance);
//                 totalHeight += distance;

//                 if (totalHeight >= scrollHeight - window.innerHeight) {
//                     clearInterval(timer);
//                     resolve();
//                 }
//             }, 100);
//         });
//     });
// }

// // Scrape a single URL
// async function scrapePage(browser, url) {
//     try {
//         const page = await browser.newPage();
//         await page.goto(url, { waitUntil: "networkidle0" });
//         await autoScroll(page);

//         const extractedText = await page.evaluate(() => {
//             const container = document.querySelector("main") || document.body;
//             return container.innerText;
//         });

//         await page.close();

//         return { url, extractedText };
//     } catch (err) {
//         console.error(`Failed to scrape ${url}:`, err.message);
//         return { url, extractedText: "" };
//     }
// }

// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ error: "Method not allowed" });
//     }

//     const { sitemapUrl } = req.body;

//     if (!sitemapUrl) {
//         return res.status(400).json({ error: "sitemapUrl is required" });
//     }

//     try {
//         // 1️⃣ Fetch sitemap XML
//         const sitemapResponse = await axios.get(sitemapUrl);
//         const sitemapXML = sitemapResponse.data;

//         // 2️⃣ Parse XML to get URLs
//         const parsed = await parseStringPromise(sitemapXML);
//         const urls = parsed.urlset.url.map((u) => u.loc[0].trim());

//         // 3️⃣ Launch Puppeteer once
//         const browser = await puppeteer.launch({
//             headless: true,
//             args: ["--no-sandbox", "--disable-setuid-sandbox"],
//         });

//         const scrapedData = [];
//         let count = 0;
//         for (const url of urls) {
//             console.log(`Scraping: ${url}`);
//             const data = await scrapePage(browser, url);
//             console.log("🚀 ~ handler ~ data:", data);
//             scrapedData.push(data);
//             count++;
//             console.log("🚀 ~ handler ~ count:", count)
//             if (count >= 10) break; // Limit to first 10 URLs for demo
//         }

//         await browser.close();

//         // 4️⃣ Save all data to JSON
//         const filePath = path.join(process.cwd(), "public", "scraped_data.json");
//         fs.writeFileSync(filePath, JSON.stringify(scrapedData, null, 2), "utf-8");

//         return res.status(200).json({
//             message: "Scraping successful",
//             totalItems: scrapedData.length,
//             file: "/scraped_data.json",
//             data: scrapedData,
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: "Failed to scrape sitemap" });
//     }
// }

















import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import axios from "axios";
import { parseStringPromise } from "xml2js";

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

function cleanText(text) {
    if (!text) return "";
    return (
        text
            .replace(/\n{2,}/g, "\n") // collapse multiple newlines
            .replace(/\s{2,}/g, " ") // collapse multiple spaces
            .trim()
    );
}

async function scrapePage(browser, url, includeFooter = false) {
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle0" });
        await autoScroll(page);

        const { mainText, footerText } = await page.evaluate((includeFooter) => {
            const container = document.querySelector("main") || document.body;
            const footer = document.querySelector("footer");
            const footerText = footer ? footer.innerText : "";

            let text = container ? container.innerText : document.body.innerText;

            // Remove footer text if not including it
            if (!includeFooter && footerText) {
                text = text.replace(footerText, "");
            }

            return {
                mainText: text,
                footerText: includeFooter ? footerText : "",
            };
        }, includeFooter);

        await page.close();

        return {
            url,
            extractedText: cleanText(mainText),
            ...(includeFooter ? { footerText: cleanText(footerText) } : {}),
        };
    } catch (err) {
        console.error(`❌ Failed to scrape ${url}:`, err.message);
        return { url, extractedText: "" };
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { sitemapUrl } = req.body;
    if (!sitemapUrl) {
        return res.status(400).json({ error: "sitemapUrl is required" });
    }

    try {
        // 1️⃣ Fetch sitemap
        const sitemapResponse = await axios.get(sitemapUrl);
        const parsed = await parseStringPromise(sitemapResponse.data);
        const urls = parsed.urlset.url.map((u) => u.loc[0].trim());
        // console.log("🚀 ~ handler ~ urls:", urls)

        // 2️⃣ Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const scrapedData = [];
        let footerCaptured = false;

        let count = 1;
        for (const [index, url] of urls.entries()) {
            console.log("🚀 ~ handler ~ count:", count)
            console.log(`🕷️ Scraping (${index + 1}/${urls.length}): ${url}`);
            count++;

            const data = await scrapePage(browser, url, !footerCaptured);
            // console.log("🚀 ~ handler ~ data:", data)

            scrapedData.push(data);

            if (!footerCaptured && data.footerText) {
                footerCaptured = true;
            }
        }

        await browser.close();

        // 3️⃣ Save data
        const filePath = path.join(process.cwd(), "public", "scraped_data.json");
        fs.writeFileSync(filePath, JSON.stringify(scrapedData, null, 2), "utf-8");

        return res.status(200).json({
            message: "Scraping successful ✅",
            totalItems: scrapedData.length,
            file: "/scraped_data.json",
            data: scrapedData,
        });
    } catch (error) {
        console.error("🚨 Scraping error:", error);
        return res.status(500).json({ error: "Failed to scrape sitemap" });
    }
}
