"use strict";
// import express, { Request, Response } from 'express';
// import { searchBitcoinPrice } from './searchBitcoin'; // Your search function
// import { db, admin } from '../config/firebase'; // Firebase DB and Admin import
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const app = express();
// const port = 5000;
// app.get('/search', async (req: Request, res: Response) => {
//   try {
//     // Call the function to search for bitcoin price related articles
//     const results = await searchBitcoinPrice();
//     // Save each result to Firestore
//     for (let result of results) {
//       const { title, link: url } = result;
//       // Save the result to Firebase Firestore
//       await db.collection('articles').add({
//         title,
//         url,
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       });
//     }
//     // Send success response
//     res.json({ message: 'Articles saved successfully', results });
//   } catch (error) {
//     console.error('Error saving articles to Firebase:', error);
//     res.status(500).json({ error: 'An error occurred while saving articles' });
//   }
// });
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });
const express_1 = __importDefault(require("express"));
const searchBitcoin_1 = require("./searchBitcoin"); // Your search function
const firebase_1 = require("../config/firebase");
const saveArticlesToFirebase_1 = require("../config/saveArticlesToFirebase");
const cors_1 = __importDefault(require("cors"));
const openai_1 = require("openai");
const body_parser_1 = __importDefault(require("body-parser"));
const { encoding_for_model } = require("openai");
const { PineconeClient } = require('@pinecone-database/pinecone');
const app = (0, express_1.default)();
const port = 5000;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Allow your frontend
}));
app.use((req, res, next) => {
    console.log(`Request body size: ${JSON.stringify(req.body).length} bytes`);
    next();
});
app.use(body_parser_1.default.raw({ limit: '100mb', type: 'application/json' }));
app.use(express_1.default.json({ limit: '100mb' }));
app.use(express_1.default.urlencoded({ limit: '100mb', extended: true }));
const openai = new openai_1.OpenAI({
    apiKey: "",
});
const pinecone = new PineconeClient();

const index = pinecone.Index('articles');
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }
        const results = await (0, searchBitcoin_1.searchBitcoinPrice)(query);
        // Assuming `saveArticlesToFirebase` is implemented
        await (0, saveArticlesToFirebase_1.saveArticlesToFirebase)(results);
        res.json({ message: 'Articles saved successfully', results });
    }
    catch (error) {
        console.error('Error saving articles:', error);
        res.status(500).json({ error: 'An error occurred while saving articles' });
    }
});
// Updated articlesRoute
app.get('/api/articles', async (req, res) => {
    try {
        const articlesSnapshot = await firebase_1.db.collection('articleBatches').get();
        const articles = [];
        articlesSnapshot.forEach((doc) => {
            articles.push(doc.data()); // Add each article data to the articles array
        });
        if (articles.length === 0) {
            res.status(404).json({ error: 'No articles found' });
            return;
        }
        res.json(articles); // Send the articles as a response
    }
    catch (error) {
        console.error('Error fetching articles from Firestore:', error);
        res.status(500).json({ error: 'Error fetching articles from Firestore' });
    }
});
app.post('/api/generate-summary', async (req, res) => {
    try {
        const { articles, prompt, isNewFile } = req.body;
        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            res.status(400).json({ error: 'Invalid or empty articles data' });
            return;
        }
        if (!prompt || typeof prompt !== 'string') {
            res.status(400).json({ error: 'Invalid or missing prompt' });
            return;
        }
        // Combine the content of all articles
        const combinedContent = articles
            .map((article) => article.content || '')
            .filter((content) => content.trim().length > 0)
            .join('\n\n'); // Add spacing between articles for better context
        if (combinedContent.length === 0) {
            res.status(400).json({ error: 'No valid content in articles' });
            return;
        }
        console.log('Processing combined content for summary...');
        // Create an embedding for the combined content
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002', // Choose the correct model for embeddings
            input: combinedContent,
        });
        const embedding = embeddingResponse.data[0].embedding;
        // Store the embedding in Pinecone
        const upsertResponse = await index.upsert({
            vectors: [
                {
                    id: `article-${Date.now()}`, // Generate a unique ID
                    values: embedding,
                    metadata: { prompt, isNewFile },
                },
            ],
        });
        console.log('Embedding stored in Pinecone:', upsertResponse);
        // Retrieve relevant embeddings from Pinecone
        const queryResponse = await index.query({
            vector: embedding,
            topK: 3, // Fetch the top 3 most relevant entries
            includeMetadata: true,
        });
        const relevantContexts = queryResponse.matches
            .map((match) => match.metadata.content)
            .filter(Boolean)
            .join('\n\n');
        console.log('Relevant contexts retrieved from Pinecone:', relevantContexts);
        // Use OpenAI to generate the summary with context
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant summarizing articles.',
                },
                {
                    role: 'user',
                    content: `${prompt}\n\nContext:\n${relevantContexts}\n\nContent:\n${combinedContent}`,
                },
            ],
            max_tokens: 500,
            temperature: 0.5,
        });
        const summary = response.choices[0]?.message?.content?.trim() || 'Unable to generate summary.';
        res.json({ summary });
    }
    catch (error) {
        console.error('Error generating summary:', error);
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data });
        }
        else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
