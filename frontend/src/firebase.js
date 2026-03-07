import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;

// Only initialize if the API key is actually provided
if (firebaseConfig.apiKey) {
    console.log("Initializing Firebase with config:", {
        ...firebaseConfig,
        apiKey: firebaseConfig.apiKey ? "***" + firebaseConfig.apiKey.slice(-4) : "MISSING!"
    });

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} else {
    console.warn("Firebase API Key is missing. Phone Auth will not work until .env is configured.");
    // Dummy auth object to prevent immediate crashes on other pages checking auth state
    auth = { onAuthStateChanged: () => { } };
}

export { app, auth };
