"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveScrapedArticlesToFile = saveScrapedArticlesToFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Function to save scraped articles to a file
async function saveScrapedArticlesToFile(articles) {
    const dirPath = path_1.default.join(__dirname, 'scrapedArticles'); // Folder where files will be saved
    // Create the directory if it doesn't exist
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath);
    }
    const timestamp = Date.now();
    const filePath = path_1.default.join(dirPath, `articles_${timestamp}.json`);
    try {
        // Write articles to a new file
        fs_1.default.writeFileSync(filePath, JSON.stringify(articles, null, 2)); // Pretty-print with 2 spaces indentation
        console.log(`Articles saved to ${filePath}`);
    }
    catch (error) {
        console.error('Error saving articles to file:', error);
    }
}
