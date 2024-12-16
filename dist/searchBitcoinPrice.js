/* eslint-disable @typescript-eslint/no-unused-vars */
import puppeteer from 'puppeteer';
import { saveArticlesToFirebase } from './config/saveArticlesToFirebase.js';
export async function searchBitcoinPrice(query) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
    const page = await browser.newPage();
    const totalPages = 5;
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
    await saveArticlesToFirebase(results);
    // await saveScrapedArticlesToFile(results);
    return results;
}
async function scrapeArticleContent(url) {
    const browser = await puppeteer.launch({
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
