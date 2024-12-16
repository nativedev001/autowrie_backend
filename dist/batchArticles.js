"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = require('fs');
const path = require('path');
const { db } = require('../config/firebase'); // Assuming firebase config is set up here
function batchAndSaveArticles() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const articlesSnapshot = yield db.collection('articles').get();
            const articles = articlesSnapshot.docs.map((doc) => doc.data());
            // Split articles into batches of 50
            const batchSize = 50;
            let batchNumber = 1;
            for (let i = 0; i < articles.length; i += batchSize) {
                const batch = articles.slice(i, i + batchSize);
                const filePath = path.join(__dirname, `./batchedArticles/articles_batch_${batchNumber}.json`);
                // Save batch to a JSON file
                fs.writeFileSync(filePath, JSON.stringify(batch, null, 2));
                console.log(`Batch ${batchNumber} saved with ${batch.length} articles`);
                batchNumber++;
            }
            console.log('All batches saved.');
        }
        catch (error) {
            console.error('Error batching and saving articles:', error);
        }
    });
}
// Run the function
batchAndSaveArticles();
export {};
