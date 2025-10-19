/**
 * Firebase Configuration and Initialization
 *
 * This module initializes and exports Firebase services for the ChatApp.
 * All Firebase-related functionality is centralized here to ensure
 * consistent configuration across the application.
 *
 * Services Initialized:
 * - Authentication (auth) - User authentication and management
 * - Firestore (db) - NoSQL database for messages and user data
 * - Storage (storage) - File storage for images, videos, documents
 * - Realtime Database (rtdb) - Real-time user presence/status
 *
 * Environment variables are loaded from .env file using Vite's import.meta.env
 *
 * @module firebase
 * @see {@link https://firebase.google.com/docs Firebase Documentation}
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

/**
 * Firebase Configuration Object
 *
 * Contains all necessary credentials to connect to Firebase services.
 * These values are loaded from environment variables to keep sensitive
 * data out of the source code.
 *
 * @constant {Object}
 * @property {string} apiKey - Firebase API key
 * @property {string} authDomain - Firebase authentication domain
 * @property {string} projectId - Firebase project ID
 * @property {string} storageBucket - Firebase storage bucket URL
 * @property {string} messagingSenderId - Firebase Cloud Messaging sender ID
 * @property {string} appId - Firebase application ID
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

/**
 * Initialized Firebase App Instance
 * @constant {FirebaseApp}
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication Instance
 * Used for user registration, login, logout, and auth state management
 * @constant {Auth}
 */
export const auth = getAuth(app);

/**
 * Firestore Database Instance
 * NoSQL database used for storing:
 * - User profiles
 * - Chat messages
 * - User chats list
 * - Call records
 * @constant {Firestore}
 */
export const db = getFirestore(app);

/**
 * Firebase Storage Instance
 * Used for storing uploaded files:
 * - User avatars
 * - Message images
 * - Videos
 * - Documents
 * - Audio recordings
 * @constant {Storage}
 */
export const storage = getStorage(app);

/**
 * Firebase Realtime Database Instance
 * Used for real-time features:
 * - User online/offline status
 * - Typing indicators
 * - Presence system
 * @constant {Database}
 */
export const rtdb = getDatabase(app);
