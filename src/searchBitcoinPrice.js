"use strict";
// import puppeteer from 'puppeteer';
// import { admin,db } from '../config/firebase';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchBitcoinPrice = searchBitcoinPrice;
// export async function searchBitcoinPrice() {
//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
//   });
//   const page = await browser.newPage();
//   const searchQuery = 'bitcoin price news';
//   const totalPages = 5;
//   const results: { title: string, link: string, content: string }[] = [];
//   for (let pageNum = 0; pageNum < totalPages; pageNum++) {
//     await page.goto(`https://www.google.com/search?q=${searchQuery}&start=${pageNum * 10}`, {
//       waitUntil: 'domcontentloaded',
//       timeout: 120000,
//     });
//     const links = await page.evaluate(() => {
//       return Array.from(document.querySelectorAll('h3')).map((element) => ({
//         title: element.innerText || 'No title',
//         link: element.closest('a')?.href || 'No link',
//       }));
//     });
//     for (let link of links) {
//       if (link.link && link.link !== 'No link') {
//         const articleContent = await scrapeArticleContent(link.link);
//         if (articleContent === 'Error fetching article content') {
//           results.push({
//             title: link.title,
//             link: link.link,
//             content: 'Content unavailable',
//           });
//         } else {
//           results.push({
//             title: link.title,
//             link: link.link,
//             content: articleContent || 'No content available',
//           });
//         }
//         if (link.title && link.link) {
//           try {
//             await saveToFirestore(link.title, link.link, articleContent);
//           } catch (error) {
//             console.error('Error saving to Firestore:', error);
//           }
//         }
//       }
//     }
//   }
//   await browser.close();
//   return results;
// }
// async function scrapeArticleContent(url: string): Promise<string> {
//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
//   });
//   const page = await browser.newPage();
//   try {
//     await page.setRequestInterception(true);
//     page.on('request', (request: { resourceType: () => string; abort: () => void; continue: () => void; }) => {
//       if (request.resourceType() === 'image' || request.resourceType() === 'media') {
//         request.abort();
//       } else {
//         request.continue();
//       }
//     });
//     await page.goto(url, {
//       waitUntil: 'networkidle2',
//       timeout: 60000,
//     });
//     const content = await page.evaluate(() => {
//       const article = document.querySelector('article') || document.body;
//       return article ? article.innerText : 'No content available';
//     });
//     return content;
//   } catch (error) {
//     console.error(`Error scraping content from ${url}:`, error);
//     return 'Error fetching article content';
//   } finally {
//     await browser.close();
//   }
// }
// async function saveToFirestore(title: string, link: string, content: string) {
//   if (!title || !link || !content) {
//     console.error('Invalid data for saving to Firestore:', { title, link, content });
//     return;
//   }
//   try {
//     const docRef = db.collection('articles').doc();
//     await docRef.set({
//       title: title,
//       link: link,
//       content: content,
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//     });
//     console.log(`Article saved: ${title}`);
//   } catch (error) {
//     console.error('Error saving article to Firestore:', error);
//   }
// }
const puppeteer_1 = __importDefault(require("puppeteer"));
const saveArticlesToFirebase_1 = require("../config/saveArticlesToFirebase"); // Import the new save function
const saveArticlesToFile_1 = require("./saveArticlesToFile"); // Optionally save to a file
async function searchBitcoinPrice(query) {
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
    const page = await browser.newPage();
    const totalPages = 5; // Number of search result pages to scrape
    const results = [];
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${pageNum * 10}`;
        await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 120000,
        });
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('h3')).map((element) => ({
                title: element.innerText || 'No title',
                link: element.closest('a')?.href || 'No link',
            }));
        });
        for (const link of links) {
            if (link.link && link.link !== 'No link') {
                try {
                    const articleContent = await scrapeArticleContent(link.link);
                    results.push({
                        title: link.title,
                        link: link.link,
                        content: articleContent || 'Content unavailable',
                    });
                }
                catch (error) {
                    console.error(`Error fetching content for link: ${link.link}`, error);
                    results.push({
                        title: link.title,
                        link: link.link,
                        content: 'Content unavailable',
                    });
                }
            }
        }
    }
    await browser.close();
    // Save the scraped articles to Firebase in a single batch
    await (0, saveArticlesToFirebase_1.saveArticlesToFirebase)(results); // Save to Firebase
    // Optionally, save the articles to a file (for backup or other purposes)
    await (0, saveArticlesToFile_1.saveScrapedArticlesToFile)(results); // Save to a file
    return results;
}
async function scrapeArticleContent(url) {
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
    const page = await browser.newPage();
    try {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.resourceType() === 'image' || request.resourceType() === 'media') {
                request.abort();
            }
            else {
                request.continue();
            }
        });
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });
        const content = await page.evaluate(() => {
            const article = document.querySelector('article') || document.body;
            return article ? article.innerText : 'No content available';
        });
        return content;
    }
    catch (error) {
        console.error(`Error scraping content from ${url}:`, error);
        return 'Error fetching article content';
    }
    finally {
        await browser.close();
    }
}
