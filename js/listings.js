import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const grid = document.getElementById('listings-grid');
const resultsCount = document.getElementById('results-count');
const resultsEmpty = document.getElementById('results-empty');
const form = document.getElementById('filter-form');

let allListings = [];

function formatPrice(value) {
  return '$' + value.toLocaleString('en-US');
}

function specsLine(listing) {
  const bedLabel = listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed${listing.bedrooms > 1 ? 's' : ''}`;
  if (listing.type === 'land') return `${listing.sqft.toLocaleString()} sqft`;
  return `${bedLabel} · ${listing.bathrooms} bath${listing.bathrooms !== 1 ? 's' : ''}`;
}

function renderListings(listings) {
  grid.innerHTML = '';

  if (listings.length === 0) {
    resultsEmpty.hidden = false;
    resultsCount.textContent = '';
    return;
  }

  resultsEmpty.hidden = true;
  resultsCount.textContent = `${listings.length} propert${listings.length === 1 ? 'y' : 'ies'} found`;

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
    `;
    grid.appendChild(card);
  });
}

function getFilters() {
  return {
    location: document.getElementById('filter-location').value.trim().toLowerCase(),
    type: document.getElementById('filter-type').value,
    beds: document.getElementById('filter-beds').value,
    maxPrice: document.getElementById('filter-price').value,
    sort: document.getElementById('filter-sort').value
  };
}

function applyFilters() {
  const { location, type, beds, maxPrice, sort } = getFilters();

  let result = allListings.filter((listing) => {
    if (location && !listing.location.toLowerCase().includes(location)) return false;
    if (type && listing.type !== type) return false;
    if (beds && listing.bedrooms < Number(beds)) return false;
    if (maxPrice && listing.price > Number(maxPrice)) return false;
    return true;
  });

  if (sort === 'price-asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    result.sort((a, b) => b.price - a.price);
  } else {
    result.sort((a, b) => (b.featured === true) - (a.featured === true));
  }

  renderListings(result);
}

// Prefill filters from the homepage search bar's query string
function prefillFromQueryString() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('location')) document.getElementById('filter-location').value = params.get('location');
  if (params.has('type')) document.getElementById('filter-type').value = params.get('type');
  if (params.has('maxPrice')) document.getElementById('filter-price').value = params.get('maxPrice');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  applyFilters();
});

async function loadListings() {
  resultsCount.textContent = 'Loading listings…';
  const snapshot = await getDocs(collection(db, 'listings'));
  allListings = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

  prefillFromQueryString();
  applyFilters();
}

loadListings();