// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJZIkUeWOa-a3EqaRwYF98rEJNtsEYhqo",
  authDomain: "footballcardgame-f7059.firebaseapp.com",
  projectId: "footballcardgame-f7059",
  storageBucket: "footballcardgame-f7059.firebasestorage.app",
  messagingSenderId: "942798000340",
  appId: "1:942798000340:web:580ca1bf91a448f8d4ab41",
  measurementId: "G-FV3NSNBKXF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);