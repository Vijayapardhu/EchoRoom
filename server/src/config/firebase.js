const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Check if credentials are provided via env vars
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    let credential;
    // Check if the env var is a JSON string (starts with '{')
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith('{')) {
        try {
            const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
            credential = admin.credential.cert(serviceAccount);
        } catch (error) {
            // Failed to parse credentials
        }
    } else {
        // Assume it's a file path
        credential = admin.credential.applicationDefault();
    }

    if (credential) {
        admin.initializeApp({ credential });
    }
} else {
    // No credentials provided, Firebase Admin not initialized
}

const db = process.env.GOOGLE_APPLICATION_CREDENTIALS ? admin.firestore() : null;

module.exports = { admin, db };
