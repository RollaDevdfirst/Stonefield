import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// True when the sign-out was triggered on purpose via the nav's
// "Sign out" button (see auth-state.js). When true, the guards below
// back off instead of racing that flow to /login.html and leaving a
// stale postAuthRedirect breadcrumb pointing at a protected page.
function isIntentionalSignOut() {
  if (sessionStorage.getItem('isSigningOut') === 'true') {
    sessionStorage.removeItem('isSigningOut');
    return true;
  }
  return false;
}

// Un-hides the page (see the .auth-pending / .auth-loading-overlay
// rules in styles.css) once access has actually been confirmed.
// Called right before the page's own callback runs — if access is
// ever denied instead, this never runs and the page stays hidden
// while the redirect happens, so there's no flash of protected
// content or its nav before the user is sent away.
function revealPage() {
  document.body.classList.remove('auth-pending');
  const overlay = document.querySelector('.auth-loading-overlay');
  if (overlay) overlay.remove();
}

// Call on any page that should only be visible to a signed-in user
// (e.g. dashboard.html). Redirects to login.html if there's no
// session, remembering where to send them back afterward.
export function requireAuth(onSignedIn) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      if (isIntentionalSignOut()) return;
      window.location.href = '/login.html';
      return;
    }
    revealPage();
    onSignedIn(user);
  });
}

// Call on any admin/* page. Checks both that someone is signed in
// AND that their users/{uid} doc has role: "admin" — this is a
// convenience redirect only, the real enforcement is Firestore
// security rules, since a client-side check alone can be bypassed.
export function requireAdmin(onConfirmedAdmin) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (isIntentionalSignOut()) return;
      window.location.href = '/login.html';
      return;
    }

    const snap = await getDoc(doc(db, 'users', user.uid));
    const role = snap.exists() ? snap.data().role : null;

    if (role !== 'admin') {
      window.location.href = '/dashboard.html';
      return;
    }

    revealPage();
    onConfirmedAdmin(user);
  });
}

// Call on dashboard.html specifically. Mirrors requireAdmin, but
// inverted: if the signed-in user turns out to be an admin (e.g. they
// clicked "View site" then "My Dashboard" while signed in as admin),
// they're redirected to their own admin dashboard instead of ever
// seeing the buyer dashboard — checked and redirected before the
// page is revealed, so there's no flash of buyer content first.
export function requireBuyer(onConfirmedBuyer) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (isIntentionalSignOut()) return;
      window.location.href = '/login.html';
      return;
    }

    const snap = await getDoc(doc(db, 'users', user.uid));
    const role = snap.exists() ? snap.data().role : null;

    if (role === 'admin') {
      window.location.href = '/admin/admin-dashboard.html';
      return;
    }

    revealPage();
    onConfirmedBuyer(user);
  });
}