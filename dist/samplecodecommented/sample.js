// const puppeteer = require('puppeteer');
export {};
// export async function searchBitcoinPrice() {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto('https://www.google.com/search?q=bitcoin+price', {
//     waitUntil: 'networkidle2',
//   });
//   // Get search result titles and links
//   const results = await page.evaluate(() => {
//     return Array.from(document.querySelectorAll('h3')).map((element) => ({
//       title: element.innerText,
//       link: element.closest('a')?.href || '',
//     }));
//   });
//   await browser.close();
//   return results;
// }
// const puppeteer = require('puppeteer');
// export async function searchBitcoinPrice() {
//     const browser = await puppeteer.launch({
//       headless: true,  // Run in headless mode (no GUI)
//       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'], // Necessary for some environments like Docker
//     });
//     const page = await browser.newPage();
//     // Define search query and pages to scrape
//     const searchQuery = 'bitcoin price news';
//     const totalPages = 5; // Scrape 5 pages of results
//     const results: { title: string, link: string, content: string }[] = [];
//     // Loop through the pages of search results
//     for (let pageNum = 0; pageNum < totalPages; pageNum++) {
//       await page.goto(`https://www.google.com/search?q=${searchQuery}&start=${pageNum * 10}`, {
//         waitUntil: 'domcontentloaded',
//         timeout: 120000, // Timeout increased to 2 minutes for slow loading
//       });
//       // Get the search results (titles and links)
//       const links = await page.evaluate(() => {
//         return Array.from(document.querySelectorAll('h3')).map((element) => ({
//           title: element.innerText,
//           link: element.closest('a')?.href || '',
//         }));
//       });
//       // For each result, visit the article and scrape the content
//       for (let link of links) {
//         if (link.link) {
//           const articleContent = await scrapeArticleContent(link.link);
//           // If the article content is not fetched, only store the title and link
//           if (articleContent === 'Error fetching article content') {
//             results.push({
//               title: link.title,
//               link: link.link,
//               content: 'Content unavailable', // Indicate content couldn't be fetched
//             });
//           } else {
//             results.push({
//               title: link.title,
//               link: link.link,
//               content: articleContent,
//             });
//           }
//         }
//       }
//     }
//     await browser.close();
//     return results;
//   }
//   // Function to scrape article content
//   async function scrapeArticleContent(url: string): Promise<string> {
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
//     });
//     const page = await browser.newPage();
//     try {
//       // Set request interception to block unnecessary resources like images
//       await page.setRequestInterception(true);
//       page.on('request', (request: { resourceType: () => string; abort: () => void; continue: () => void; }) => {
//         if (request.resourceType() === 'image' || request.resourceType() === 'media') {
//           request.abort();
//         } else {
//           request.continue();
//         }
//       });
//       // Increase timeout and change the load strategy
//       await page.goto(url, {
//         waitUntil: 'networkidle2',  // Wait until there are no network connections for 500 ms
//         timeout: 60000,  // Increase timeout to 60 seconds
//       });
//       const content = await page.evaluate(() => {
//         const article = document.querySelector('article') || document.body;
//         return article ? article.innerText : 'No content available';
//       });
//       return content;
//     } catch (error) {
//       console.error(`Error scraping content from ${url}:`, error);
//       return 'Error fetching article content';  // Return a default message if scraping fails
//     } finally {
//       await browser.close();
//     }
//   }
