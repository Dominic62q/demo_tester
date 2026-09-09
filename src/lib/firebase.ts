import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// All values come from the environment (see .env.example).
// Never commit a real .env file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY as string,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FB_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID as string,
  appId: import.meta.env.VITE_FB_APP_ID as string,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
