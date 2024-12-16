// import { db, admin } from './firebase'; // Firebase DB and Admin import
// export async function saveArticlesToFirebase(articles: any[]) {
//   const batch = db.batch(); // Create a batch for efficient writes
//   try {
//     // Loop through all articles and prepare them for batch write
//     for (let article of articles) {
//       const { title, url, content } = article;
//       // Create a new document reference for each article
//       const articleRef = db.collection('articles').doc();
//       // Set the data for the article in the batch
//       batch.set(articleRef, {
//         title,
//         url,
//         content,
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       });
//       // Log each article being processed (for debugging)
//       console.log(`Preparing to save article: ${title}`);
//     }
//     // Commit the batch
//     await batch.commit();
//     console.log('Articles saved to Firebase successfully');
//   } catch (error) {
//     console.error('Error saving articles to Firebase:', error);
//   }
// }
import { db, admin } from './firebase'; // Firebase DB and Admin import
export async function saveArticlesToFirebase(articles) {
    try {
        // Create a new document reference for the batch in Firestore
        const batchRef = db.collection('articleBatches').doc(); // Create a new document for this batch
        // Save all the articles in a single document under the 'articles' field
        await batchRef.set({
            articles: articles, // Save the entire batch of articles as an array
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('Batch of articles saved to Firebase successfully');
    }
    catch (error) {
        console.error('Error saving batch of articles to Firebase:', error);
    }
}
