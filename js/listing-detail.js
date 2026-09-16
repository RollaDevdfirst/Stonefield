import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const listingId = params.get('id');

let currentUser = null;
let currentListing = null;
let currentFavorites = [];

function formatPrice(value) {
  return '$' + value.toLocaleString('en-US');
}

function renderSpecs(listing) {
  const specs = document.getElementById('detail-specs');
  const items = [];

  if (listing.type === 'land') {
    items.push(`${listing.sqft.toLocaleString()} sqft`);
  } else {
    items.push(listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed${listing.bedrooms > 1 ? 's' : ''}`);
    items.push(`${listing.bathrooms} bath${listing.bathrooms !== 1 ? 's' : ''}`);
    items.push(`${listing.sqft.toLocaleString()} sqft`);
  }

  specs.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function renderGallery(listing) {
  const mainImage = document.getElementById('gallery-main-image');
  const thumbsWrap = document.getElementById('gallery-thumbs');

  mainImage.src = listing.images[0];
  mainImage.alt = listing.title;
  thumbsWrap.innerHTML = '';

  if (listing.images.length <= 1) return;

  listing.images.forEach((src, index) => {
    const thumb = document.createElement('button');
    thumb.className = 'gallery-thumb' + (index === 0 ? ' is-active' : '');
    thumb.setAttribute('aria-label', `View photo ${index + 1}`);
    thumb.innerHTML = `<img src="${src}" alt="" loading="lazy" />`;
    thumb.addEventListener('click', () => {
      mainImage.src = src;
      thumbsWrap.querySelectorAll('.gallery-thumb').forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
    thumbsWrap.appendChild(thumb);
  });
}

function renderDetails(listing) {
  document.title = `${listing.title} — Stonefield & Co.`;
  document.getElementById('detail-status').textContent =
    listing.status === 'sold' ? 'Sold' : 'Available';
  document.getElementById('detail-title').textContent = listing.title;
  document.getElementById('detail-location').textContent = listing.location;
  document.getElementById('detail-description').textContent = listing.description;
  document.getElementById('detail-price').textContent = formatPrice(listing.price);
  renderSpecs(listing);
  renderGallery(listing);
  updateMetaTags(listing);
  injectStructuredData(listing);
}

// Fills the OG/Twitter/canonical placeholders in <head> with real
// listing data. Note: this only helps crawlers that execute JS
// (Google eventually does). Crawlers that don't run JS at all —
// Facebook, Twitter, LinkedIn link previews — won't see this. That
// gap is exactly what the Section 14 Cloudflare Worker fixes later
// by rendering these tags server-side before the page is served.
function updateMetaTags(listing) {
  const url = `https://your-domain-here.pages.dev/listing-detail.html?id=${listing.id}`;
  const description = `${listing.title} in ${listing.location} — ${formatPrice(listing.price)}. ${listing.description}`;

  document.getElementById('canonical-link').setAttribute('href', url);
  document.getElementById('og-title').setAttribute('content', `${listing.title} — Stonefield & Co.`);
  document.getElementById('og-description').setAttribute('content', description);
  document.getElementById('og-image').setAttribute('content', listing.images[0]);
  document.getElementById('og-url').setAttribute('content', url);
  document.getElementById('twitter-title').setAttribute('content', `${listing.title} — Stonefield & Co.`);
  document.getElementById('twitter-description').setAttribute('content', description);
  document.getElementById('twitter-image').setAttribute('content', listing.images[0]);
}

// JSON-LD structured data — helps search engines and other tools
// understand this is a property listing, its price, and status.
function injectStructuredData(listing) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description,
    url: `https://your-domain-here.pages.dev/listing-detail.html?id=${listing.id}`,
    image: listing.images,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: listing.status === 'sold'
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock'
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.location
    }
  });
  document.head.appendChild(script);
}

// ===== Favorites (Firestore: users/{uid}.favorites array) =====
// Signed-out visitors can still click the button — they're sent to
// login.html first, then back here afterward (see auth.js redirect).
function updateFavoriteButtonUI() {
  const button = document.getElementById('favorite-toggle');
  const isFavorited = currentListing && currentFavorites.includes(currentListing.id);
  button.setAttribute('aria-pressed', String(Boolean(isFavorited)));
}

async function loadUserFavorites(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  currentFavorites = snap.exists() ? (snap.data().favorites || []) : [];
  updateFavoriteButtonUI();
}

function initFavoriteToggle() {
  const button = document.getElementById('favorite-toggle');

  button.addEventListener('click', async () => {
    if (!currentUser) {
      sessionStorage.setItem('postAuthRedirect', window.location.pathname + window.location.search);
      window.location.href = 'login.html';
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const isFavorited = currentFavorites.includes(currentListing.id);

    if (isFavorited) {
      await updateDoc(userRef, { favorites: arrayRemove(currentListing.id) });
      currentFavorites = currentFavorites.filter((id) => id !== currentListing.id);
    } else {
      await updateDoc(userRef, { favorites: arrayUnion(currentListing.id) });
      currentFavorites.push(currentListing.id);
    }

    updateFavoriteButtonUI();
  });
}

// ===== Inquiry form (Firestore: inquiries collection) =====
// Works for both guests and signed-in users — userId is null for guests.
function prefillInquiryFields() {
  if (!currentUser) return;
  const nameField = document.getElementById('inquiry-name');
  const emailField = document.getElementById('inquiry-email');
  if (currentUser.displayName && !nameField.value) nameField.value = currentUser.displayName;
  if (currentUser.email && !emailField.value) emailField.value = currentUser.email;
}

function initInquiryForm() {
  const form = document.getElementById('inquiry-form');
  const success = document.getElementById('inquiry-success');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      listingId: currentListing.id,
      userId: currentUser ? currentUser.uid : null,
      name: document.getElementById('inquiry-name').value,
      email: document.getElementById('inquiry-email').value,
      message: document.getElementById('inquiry-message').value,
      status: 'new',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'inquiries'), payload);

    form.hidden = true;
    success.hidden = false;
  });
}

async function loadListing() {
  const snap = await getDoc(doc(db, 'listings', listingId));

  if (!snap.exists()) {
    document.getElementById('detail-title').textContent = 'Listing not found';
    document.getElementById('detail-description').textContent =
      'This property may have been removed or the link is incorrect.';
    return;
  }

  currentListing = { id: snap.id, ...snap.data() };
  renderDetails(currentListing);
  initFavoriteToggle();
  initInquiryForm();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  prefillInquiryFields();
  if (user) {
    await loadUserFavorites(user.uid);
  } else {
    currentFavorites = [];
    updateFavoriteButtonUI();
  }
});

loadListing();