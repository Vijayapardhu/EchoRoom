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
            console.log('Firebase Admin initialized with JSON string credentials');
        } catch (error) {
            console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS JSON:', error);
        }
    } else {
        // Assume it's a file path
        credential = admin.credential.applicationDefault();
        console.log('Firebase Admin initialized with application default credentials (file path)');
    }

    if (credential) {
        admin.initializeApp({ credential });
    }
} else {
    console.warn('WARNING: GOOGLE_APPLICATION_CREDENTIALS not found. Firebase Admin not initialized. Auth verification will fail.');
    // For development without credentials, we might want to mock or just warn
}

const db = process.env.GOOGLE_APPLICATION_CREDENTIALS ? admin.firestore() : null;

module.exports = { admin, db };
