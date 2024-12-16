// const { PineconeClient } = require('@pinecone-database/pinecone');
// const openai = require('openai');

// const pinecone = new PineconeClient();
// pinecone.init({
//     apiKey: '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',
//     environment: 'pcsk_53ck4u_GxSt7PeDdXTpTVXo9ffNS9egMV3V6WxmLkViqkjJKyiFMNRA2soDxSV5GbdTkCv', // Check your Pinecone dashboard for details
// });



// async function getEmbedding(content) {
//     const response = await openai.embeddings.create({
//         input: content,
//         model: 'text-embedding-ada-002', // Embedding model
//     });
//     return response.data[0].embedding;
// }


// async function storeInPinecone(id, content, metadata) {
//     const vector = await getEmbedding(content);

//     const index = pinecone.Index('your-index-name');
//     await index.upsert([
//         {
//             id: id,
//             values: vector,
//             metadata: metadata,
//         },
//     ]);
// }

// async function searchInPinecone(query) {
//     const queryVector = await getEmbedding(query);

//     const index = pinecone.Index('articles');
//     const results = await index.query({
//         topK: 5, // Number of closest matches
//         vector: queryVector,
//         includeMetadata: true, // Include article metadata in the response
//     });

//     return results.matches.map((match) => match.metadata);
// }

// export default searchInPinecone