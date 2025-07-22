// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace this config with your Firebase project’s config
const firebaseConfig = {
  apiKey: "AIzaSyAlwtI_riHb6_xWu_z-cVrsEGRhspWQYRc",
  authDomain: "rewards-4bcb2.firebaseapp.com",
  projectId: "rewards-4bcb2",
  storageBucket: "rewards-4bcb2.firebasestorage.app",
  messagingSenderId: "263952772314",
  appId: "1:263952772314:web:e442a0d06c886eee24c9e3"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
