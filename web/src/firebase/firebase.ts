import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBLhUJLOi0MQGKUEyUgXhpZo1WNB_0fxyk",
    authDomain: "easy-ramzan-recipe.firebaseapp.com",
    projectId: "easy-ramzan-recipe",
    storageBucket: "easy-ramzan-recipe.firebasestorage.app",
    messagingSenderId: "268492862038",
    appId: "1:268492862038:web:ddaa3f17ff4993d30401f7",
    measurementId: "G-2XWTSFTWFT"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics (only on client side)
let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { auth, db, analytics };