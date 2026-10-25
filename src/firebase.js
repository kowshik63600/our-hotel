import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCYOUncMuXJSRF672DveRaFo31KZXg83s4",
    authDomain: "expense-tracker-a933a.firebaseapp.com",
    projectId: "expense-tracker-a933a",
    storageBucket: "expense-tracker-a933a.firebasestorage.app",
    messagingSenderId: "36132188987",
    appId: "1:36132188987:web:92d17bb141694760f5fd1e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);