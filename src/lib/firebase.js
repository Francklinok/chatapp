// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOK_yhT61H7NJKbFTSUcW_LPXmm6EWlPg",
  authDomain: "newchatapp-fd9c7.firebaseapp.com",
  projectId: "newchatapp-fd9c7",
  storageBucket: "newchatapp-fd9c7.appspot.com",
  messagingSenderId: "605578322292",
  appId: "1:605578322292:web:0f838933ed7e1c09facc21",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

