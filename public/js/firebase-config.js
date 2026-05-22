/* ============================================================
   MediCart - Firebase Configuration
   Using Firebase compat SDK loaded via CDN in HTML pages
   ============================================================ */

// ── Firebase Configuration ───────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBGRcFV1We23TvSmXBdPWAfgMF1656NnX4",
  authDomain: "medicart-a65c2.firebaseapp.com",
  projectId: "medicart-a65c2",
  storageBucket: "medicart-a65c2.firebasestorage.app",
  messagingSenderId: "484498558346",
  appId: "1:484498558346:web:1492e2eca513429ea78c73"
};

// ── Initialize Firebase (compat SDK from CDN) ────────────────
firebase.initializeApp(firebaseConfig);

// ── Auth instance ────────────────────────────────────────────
const auth = firebase.auth();

// ── Google Provider ──────────────────────────────────────────
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Prefer popup selection each time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

console.log('🔥 Firebase initialized for project: medicart-a65c2');
