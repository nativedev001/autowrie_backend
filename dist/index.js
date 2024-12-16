import express from 'express';
import { searchBitcoinPrice } from './searchBitcoinPrice.js';
import cors from 'cors';
// import { OpenAI } from 'openai';
import bodyParser from 'body-parser';
import { db } from './config/firebase.js';
import { saveArticlesToFirebase } from './config/saveArticlesToFirebase.js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
const app = express();
const port = 5000;
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' })); // For body-parser
app.use(express.json({ limit: '50mb' }));
app.use(cors({
    origin: 'http://localhost:3000', // Allow your frontend
}));
app.use((req, res, next) => {
    console.log(`Request body size: ${JSON.stringify(req.body).length} bytes`);
    next();
});
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API,
});
const openAiApiKey = process.env.OPENAI_API_KEY;
if (!openAiApiKey) {
    console.error('OPENAI_API_KEY is missing');
    process.exit(1); // Exit the application if key is not found
}
const MAX_TOKENS = 16000; // Token limit for gpt-3.5-turbo
const MAX_RESPONSE_TOKENS = 1000; // Max response tokens to leave room for input tokens
// Utility function to count tokens (approximation)
const countTokens = (text) => {
    // Approximate token count based on average word length (may need refinement)
    return Math.ceil(text.length / 4);
};
// Utility function to chunk content based on token count (estimate)
const chunkContent = (content, maxTokens = MAX_TOKENS - MAX_RESPONSE_TOKENS) => {
    const chunks = [];
    let currentChunk = '';
    let currentTokenCount = 0;
    const words = content.split(' ');
    for (const word of words) {
        const tokenCount = countTokens(word); // Approximate token count per word
        if (currentTokenCount + tokenCount <= maxTokens) {
            currentChunk += ` ${word}`;
            currentTokenCount += tokenCount;
        }
        else {
            chunks.push(currentChunk.trim());
            currentChunk = word;
            currentTokenCount = tokenCount;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
};
// app.post('/api/generate-summary', async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { allBatches } = req.body;
//     if (!allBatches || !Array.isArray(allBatches) || allBatches.length === 0) {
//       res.status(400).json({ error: 'No batches provided' });
//       return;
//     }
//     // Step 1: Collect all batch content into one single string
//     let allContent = '';
//     allBatches.forEach((batch: any) => {
//       batch.articles.forEach((article: any) => {
//         allContent += `Title: ${article.title}\nContent: ${article.content}\n\n`;
//       });
//     });
//     // Step 2: Generate a summary for all collected articles content
//     const summaryResponse = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content: "You are a professional summarizer. Please create a unified, meaningful summary from the provided content that covers all articles and remains concise and informative. Limit the summary to 20 lines but avoid cutting off meaningful content.",
//         },
//         {
//           role: "user",
//           content: `Content to summarize: ${allContent}`,
//         },
//       ],
//       temperature: 0.7,
//       max_tokens: 1000,
//     });
//     const finalSummary = summaryResponse.choices[0]?.message?.content?.trim();
//     if (!finalSummary) {
//       throw new Error('No final summary generated.');
//     }
//     // Step 3: If the content is longer, ensure it's a meaningful summary but doesn't exceed the 20 lines limit
//     const finalSummaryLines = finalSummary.split('\n');
//     const finalSummaryLimited = finalSummaryLines.length > 20 ? finalSummaryLines.slice(0, 20).join('\n') : finalSummary;
//     // Return the final unified summary to the frontend
//     res.json({
//       success: true,
//       unifiedSummary: finalSummaryLimited,
//     });
//   } catch (error: any) {
//     console.error('Error in generate-summary:', error.message || error.toString());
//     res.status(500).json({
//       error: 'Error generating summary',
//       details: error.message || error.toString(),
//     });
//   }
// });
app.post('/api/generate-summary', async (req, res) => {
    try {
        const { allBatches } = req.body;
        if (!allBatches || !Array.isArray(allBatches) || allBatches.length === 0) {
            res.status(400).json({ error: 'No batches provided' });
            return;
        }
        // Step 1: Collect all batch content into one single string
        let allContent = '';
        allBatches.forEach((batch) => {
            batch.articles.forEach((article) => {
                allContent += `Title: ${article.title}\nContent: ${article.content}\n\n`;
            });
        });
        // Step 2: Check token count for content
        const tokenCount = countTokens(allContent);
        console.log('Total token count of all content:', tokenCount); // Log total tokens
        // Step 3: Chunk the content to avoid exceeding token limits
        const contentChunks = chunkContent(allContent);
        console.log('Number of chunks created:', contentChunks.length); // Log number of chunks created
        const chunkSummaries = [];
        // Step 4: Generate summaries for each chunk of content
        for (let i = 0; i < contentChunks.length; i++) {
            const chunk = contentChunks[i];
            console.log(`Sending chunk ${i + 1} with token count: ${countTokens(chunk)}`); // Log token count for each chunk
            const summaryResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional summarizer. Please create a unified, meaningful summary from the provided content that covers all articles and remains concise and informative. Limit the summary to 20 lines but avoid cutting off meaningful content.",
                    },
                    {
                        role: "user",
                        content: `Content to summarize: ${chunk}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: MAX_RESPONSE_TOKENS, // Limit response to 1000 tokens per request
            });
            const chunkSummary = summaryResponse.choices[0]?.message?.content?.trim();
            if (chunkSummary) {
                chunkSummaries.push(chunkSummary);
            }
        }
        // Step 5: Combine summaries from all chunks and create a final summary
        const combinedSummary = chunkSummaries.join(' ');
        // Step 6: Ensure the final summary doesn't exceed 20 lines
        const finalSummaryLines = combinedSummary.split('\n');
        const finalSummaryLimited = finalSummaryLines.length > 20 ? finalSummaryLines.slice(0, 20).join('\n') : combinedSummary;
        // Return the final unified summary to the frontend
        res.json({
            success: true,
            unifiedSummary: finalSummaryLimited,
        });
    }
    catch (error) {
        console.error('Error in generate-summary:', error.message || error.toString());
        res.status(500).json({
            error: 'Error generating summary',
            details: error.message || error.toString(),
        });
    }
});
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }
        const results = await searchBitcoinPrice(query);
        // Assuming `saveArticlesToFirebase` is implemented
        await saveArticlesToFirebase(results);
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
        const articlesSnapshot = await db.collection('articleBatches').get();
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
app.post('/save-article', async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || content.trim() === '') {
            res.status(400).json({ message: 'Content is required.' });
            return;
        }
        // Generate a title using OpenAI Chat Completions
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are an assistant that generates concise and engaging titles for articles.',
                },
                {
                    role: 'user',
                    content: `Generate a title for the following content:\n\n${content}`,
                },
            ],
            max_tokens: 60,
            n: 1,
        });
        const choice = response.choices?.[0];
        const message = choice?.message;
        if (!message || !message.content) {
            res.status(500).json({ message: 'Failed to generate title.' });
            return;
        }
        const title = message.content.trim();
        console.log("title", title);
        // Save to Firestore
        const docRef = await db.collection('article_summarize').add({
            title,
            content,
            createdAt: Date.now(), // Use FieldValue correctly
        });
        res.status(201).json({
            message: 'Article saved successfully.',
            id: docRef.id,
            title,
        });
    }
    catch (error) {
        console.error('Error saving article:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
