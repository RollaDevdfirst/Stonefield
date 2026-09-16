import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

function showAuthError(message) {
  const errorBox = document.getElementById('auth-error');
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function hideAuthError() {
  const errorBox = document.getElementById('auth-error');
  if (errorBox) errorBox.hidden = true;
}

// Human-readable messages for the Firebase Auth error codes you'll
// actually hit during normal use — everything else falls back to a
// generic message rather than showing a raw "auth/..." code.
function friendlyAuthError(code) {
  const messages = {
    'auth/invalid-email': 'That email address doesn\'t look right.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
    'auth/network-request-failed': 'Network error, please check your connection and try again.'
  };
  return messages[code] || 'Something went wrong. Please try again.';
}

// After sign-in, buyers always land on their dashboard and admins
// always land on theirs — no "return to what you were doing"
// breadcrumb logic. Simpler, and removes an entire class of redirect
// races we were chasing before.
async function redirectByRole(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  const role = snap.exists() ? snap.data().role : 'buyer';
  window.location.href = role === 'admin' ? '/admin/admin-dashboard.html' : '/dashboard.html';
}

// Creates the matching users/{uid} doc the first time someone signs
// in, whether via email/password or Google. Security rules should
// only ever let a user write their own doc, and never let them set
// role to "admin" themselves (that's set manually in the console).
async function ensureUserDoc(user, extraFields = {}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName || extraFields.name || '',
      email: user.email,
      role: 'buyer',
      favorites: [],
      createdAt: serverTimestamp()
    });
  }
}

// ===== Email / password login =====
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthError();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showAuthError('Please enter both your email and password.');
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await redirectByRole(credential.user.uid);
    } catch (err) {
      showAuthError(friendlyAuthError(err.code));
    }
  });
}

// ===== Email / password signup =====
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthError();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) {
      showAuthError('Please fill in every field.');
      return;
    }

    if (password.length < 8) {
      showAuthError('Password must be at least 8 characters.');
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await ensureUserDoc(credential.user, { name });
      window.location.href = '/dashboard.html';
    } catch (err) {
      showAuthError(friendlyAuthError(err.code));
    }
  });
}

// ===== Google sign-in / sign-up (same flow either way) =====
function initGoogleButton(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.addEventListener('click', async () => {
    hideAuthError();

    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDoc(result.user);
      await redirectByRole(result.user.uid);
    } catch (err) {
      showAuthError(friendlyAuthError(err.code));
    }
  });
}

initGoogleButton('google-signin');
initGoogleButton('google-signup');