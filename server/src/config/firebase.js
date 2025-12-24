const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Check if credentials are provided via env vars
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin initialized with application default credentials');
} else {
    console.warn('WARNING: GOOGLE_APPLICATION_CREDENTIALS not found. Firebase Admin not initialized. Auth verification will fail.');
    // For development without credentials, we might want to mock or just warn
}

const db = process.env.GOOGLE_APPLICATION_CREDENTIALS ? admin.firestore() : null;

module.exports = { admin, db };
