// Runs on every page. Keeps the header's "Sign in" link in sync with
// the real Firebase auth state — becomes "Sign out" when a session
// exists, and signs the user out in place when clicked.

import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const navCta = document.querySelector('.nav-cta');

if (navCta) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      navCta.textContent = 'Sign out';
      navCta.setAttribute('href', '#');
      navCta.onclick = (e) => {
        e.preventDefault();
        // Tell any auth guard on this page (requireAuth/requireAdmin)
        // that this sign-out was intentional, so it backs off instead
        // of racing to /login.html the instant the session clears.
        sessionStorage.setItem('isSigningOut', 'true');
        signOut(auth).then(() => {
          window.location.href = '/index.html';
        });
      };
    } else {
      navCta.textContent = 'Sign in';
      navCta.setAttribute('href', '/login.html');
      navCta.onclick = null;
    }
  });
}