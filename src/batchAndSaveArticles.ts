const fs = require('fs');
const path = require('path');
const { db } = require('../config/firebase'); // Assuming firebase config is set up here

export async function batchAndSaveArticles() {
  try {
    // Define the directory path
    const batchDirectory = path.join(__dirname, './batchedArticles');
    
    // Check if the directory exists, and create it if it doesn't
    if (!fs.existsSync(batchDirectory)) {
      fs.mkdirSync(batchDirectory);
    }

    const articlesSnapshot = await db.collection('articles').get();
    const articles = articlesSnapshot.docs.map((doc: { data: () => any; }) => doc.data());

    const batchSize = 50;
    let batchNumber = 1;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const filePath = path.join(batchDirectory, `articles_batch_${batchNumber}.json`);

      fs.writeFileSync(filePath, JSON.stringify(batch, null, 2));
      console.log(`Batch ${batchNumber} saved with ${batch.length} articles`);

      batchNumber++;
    }
    console.log('All batches saved.');
  } catch (error) {
    console.error('Error batching and saving articles:', error);
  }
}

// Run the function
batchAndSaveArticles();
