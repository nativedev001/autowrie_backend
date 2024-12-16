import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("Initializing Firebase...");
try {
    const serviceAccount = path.join(__dirname, './firebaseServiceAccount.json');
    console.log("Service Account Path:", serviceAccount);
    initializeApp({
        credential: cert(serviceAccount)
    });
    console.log("Firebase initialized successfully.");
}
catch (error) {
    console.error("Error initializing Firebase:", error);
}
// Initialize Firestore
const db = getFirestore();
db.settings({
    ignoreUndefinedProperties: true
});
export { db, admin };
