import * as firebase from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDXcHjPrtgK9G0WiPSuzz51kWwTCIsGhIA",
  authDomain: "studio-6605626504-b72a6.firebaseapp.com",
  projectId: "studio-6605626504-b72a6",
  storageBucket: "studio-6605626504-b72a6.firebasestorage.app",
  messagingSenderId: "816377396722",
  appId: "1:816377396722:web:5cf37615bbee9faf277f6b"
};

// Use namespace import and cast to any to bypass "Module 'firebase/app' has no exported member 'initializeApp'" 
// which can occur due to TypeScript module resolution mismatches in some environments.
const app = (firebase as any).initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);