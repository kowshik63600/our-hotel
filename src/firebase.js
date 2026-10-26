import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Hotel Desk Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBDEVp9lKU8y-SkuUpi-oYg7e-MJzD9v-k",
    authDomain: "hotel-desk-management.firebaseapp.com",
    projectId: "hotel-desk-management",
    storageBucket: "hotel-desk-management.firebasestorage.app",
    messagingSenderId: "240644416653",
    appId: "1:240644416653:web:1cc20915229d3fb993eec4",
    measurementId: "G-CPET3TNELR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication and database
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is optional
if (typeof window !== "undefined") {
    isSupported()
        .then((supported) => {
            if (supported) {
                getAnalytics(app);
            }
        })
        .catch(() => {});
}