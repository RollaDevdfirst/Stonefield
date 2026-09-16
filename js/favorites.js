import { db } from './firebase-config.js';
import { requireAuth } from './auth-guard.js';
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  collection,
  query,
  where,
  documentId,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const grid = document.getElementById('favorites-grid');
const resultsCount = document.getElementById('results-count');
const emptyState = document.getElementById('favorites-empty');

function formatPrice(value) {
  return '$' + value.toLocaleString('en-US');
}

function specsLine(listing) {
  const bedLabel = listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed${listing.bedrooms > 1 ? 's' : ''}`;
  if (listing.type === 'land') return `${listing.sqft.toLocaleString()} sqft`;
  return `${bedLabel} · ${listing.bathrooms} bath${listing.bathrooms !== 1 ? 's' : ''}`;
}

function renderFavorites(listings, uid) {
  grid.innerHTML = '';

  if (listings.length === 0) {
    resultsCount.textContent = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  resultsCount.textContent = `${listings.length} saved propert${listings.length === 1 ? 'y' : 'ies'}`;

  listings.forEach((listing) => {
    const card = document.createElement('article');
    card.className = 'portfolio-card';
    card.innerHTML = `
      <a href="listing-detail.html?id=${listing.id}">
        <img src="${listing.images[0]}" alt="${listing.title}" loading="lazy" />
        <div class="portfolio-overlay">
          <span class="portfolio-price">${formatPrice(listing.price)}</span>
          <h3>${listing.title}</h3>
          <p>${listing.location} · ${specsLine(listing)}</p>
        </div>
      </a>
      <button class="favorite-toggle favorite-toggle--card" aria-pressed="true" aria-label="Remove from favorites">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="1.6">
          <path d="M12 20.5s-7-4.35-9.5-8.8C.7 8.2 2.2 4.8 5.6 4.1c2-.4 4 .5 5.2 2.2C12 4.6 14 3.7 16 4.1c3.4.7 4.9 4.1 3.1 7.6C19 16.15 12 20.5 12 20.5z"/>
        </svg>
      </button>
    `;

    card.querySelector('.favorite-toggle--card').addEventListener('click', async (e) => {
      e.preventDefault();
      await updateDoc(doc(db, 'users', uid), { favorites: arrayRemove(listing.id) });
      card.remove();

      const remaining = grid.querySelectorAll('.portfolio-card').length;
      resultsCount.textContent = remaining
        ? `${remaining} saved propert${remaining === 1 ? 'y' : 'ies'}`
        : '';
      if (remaining === 0) emptyState.hidden = false;
    });

    grid.appendChild(card);
  });
}

// Firestore's "in" query supports at most 10 values at a time, so
// favorite IDs are fetched in chunks of 10 and merged — fine at this
// scale, and simple to extend later if a user saves more than that.
async function fetchListingsByIds(ids) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const results = [];
  for (const chunk of chunks) {
    const q = query(collection(db, 'listings'), where(documentId(), 'in', chunk));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => results.push({ id: docSnap.id, ...docSnap.data() }));
  }
  return results;
}

requireAuth(async (user) => {
  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const favoriteIds = userSnap.exists() ? (userSnap.data().favorites || []) : [];

  if (favoriteIds.length === 0) {
    resultsCount.textContent = '';
    emptyState.hidden = false;
    return;
  }

  const listings = await fetchListingsByIds(favoriteIds);
  renderFavorites(listings, user.uid);
});