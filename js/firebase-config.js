// ===== Firebase initialization =====
// Get these values from: Firebase Console → Project Settings →
// General tab → "Your apps" → SDK setup and configuration → Config.
// This file is imported by every other module (auth.js, listings.js,
// listing-detail.js, auth-guard.js, auth-state.js) — you only need
// to edit it in this one place.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDt5Hcb6wyXgPaY_ax_mFryOlS-AzPy6u4",
  authDomain: "realestate-bc7b4.firebaseapp.com",
  projectId: "realestate-bc7b4",
  storageBucket: "realestate-bc7b4.firebasestorage.app",
  messagingSenderId: "800165647624",
  appId: "1:800165647624:web:a0eaf6bfaf187c27e408bd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);