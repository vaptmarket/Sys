import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Credentials derived from firebase-applet-config.json for the workspace
const firebaseConfig = {
  apiKey: "AIzaSyDSdjUNx365zGGF7rmXG0FQY090MkAKREo",
  authDomain: "gen-lang-client-0418980892.firebaseapp.com",
  projectId: "gen-lang-client-0418980892",
  storageBucket: "gen-lang-client-0418980892.firebasestorage.app",
  messagingSenderId: "940307106251",
  appId: "1:940307106251:web:6fac3cd49b759129d90e4e"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Initialize Firestore specifying the database id to match configured instances
export const db = getFirestore(app, "ai-studio-21fb1dab-30af-48e6-b719-bc6a381b3aa6");

// Auth provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

