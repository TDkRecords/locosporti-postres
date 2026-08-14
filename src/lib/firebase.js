import { PUBLIC_FIREBASE_API_KEY } from "$env/static/public";
import { browser } from "$app/environment";
import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithCredential,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";


const firebaseConfig = {
    apiKey: PUBLIC_FIREBASE_API_KEY,
    authDomain: "locosporti-ba83d.firebaseapp.com",
    projectId: "locosporti-ba83d",
    storageBucket: "locosporti-ba83d.firebasestorage.app",
    messagingSenderId: "561979279173",
    appId: "1:561979279173:web:4b2fe6aebc512052f5e02c",
};

const app = initializeApp(firebaseConfig);

export const auth = browser ? getAuth(app) : null;
export const db = browser ? getFirestore(app) : null;
export const googleAuthProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    if (!browser) {
        throw new Error("Firebase auth solo está disponible en el navegador.");
    }

    // Android (Capacitor)
    if (Capacitor.isNativePlatform()) {
        try {
            const googleUser = await GoogleAuth.signIn();

            if (!googleUser.authentication?.idToken) {
                throw new Error("Google no devolvió un ID Token.");
            }

            const credential = GoogleAuthProvider.credential(
                googleUser.authentication.idToken
            );

            const userCredential = await signInWithCredential(auth, credential);

            return userCredential.user;
        } catch (error) {
            console.error("Error al iniciar sesión con Google en Android:", error);
            throw error;
        }
    }

    // Web
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
};

export const signInAdminWithEmail = async (email, password) => {
    if (!browser) throw new Error("Firebase auth solo está disponible en el navegador.");
    return await signInWithEmailAndPassword(auth, email, password);
};

export const signOutFirebase = async () => {
    if (!browser) return;
    await signOut(auth);
};

export const onAuthStateChangedFirebase = (callback) => {
    if (!browser) return () => { };
    return onAuthStateChanged(auth, callback);
};