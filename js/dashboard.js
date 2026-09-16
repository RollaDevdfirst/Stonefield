import { auth, db } from './firebase-config.js';
import { requireBuyer } from './auth-guard.js';
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  collection,
  query,
  where,
  documentId,
  getDocs,
  addDoc,
  getCountFromServer,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

let currentUser = null;

// ===== Tabs =====
document.querySelectorAll('.dashboard-tab').forEach((tabButton) => {
  tabButton.addEventListener('click', () => activateTab(tabButton.dataset.tab));
});

document.querySelectorAll('[data-tab-link]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    activateTab(link.dataset.tabLink);
  });
});

function activateTab(tabName) {
  document.querySelectorAll('.dashboard-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.dashboard-panel').forEach((panel) => {
    panel.classList.toggle('is-active', panel.id === `panel-${tabName}`);
  });
}

function formatPrice(value) {
  return '$' + value.toLocaleString('en-US');
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ===== Overview =====
async function loadOverview(uid, favoritesCount) {
  document.getElementById('stat-saved').textContent = favoritesCount;

  const [buySnap, consultSnap, inquirySnap] = await Promise.all([
    getCountFromServer(query(collection(db, 'buyRequests'), where('userId', '==', uid))),
    getCountFromServer(query(collection(db, 'consultations'), where('userId', '==', uid))),
    getCountFromServer(query(collection(db, 'inquiries'), where('userId', '==', uid)))
  ]);

  document.getElementById('stat-buy').textContent = buySnap.data().count;
  document.getElementById('stat-consult').textContent = consultSnap.data().count;
  document.getElementById('stat-inquiries').textContent = inquirySnap.data().count;
}

// ===== Saved Homes =====
async function fetchListingsByIds(ids) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

  const results = [];
  for (const chunk of chunks) {
    const q = query(collection(db, 'listings'), where(documentId(), 'in', chunk));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => results.push({ id: docSnap.id, ...docSnap.data() }));
  }
  return results;
}

function specsLine(listing) {
  const bedLabel = listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed${listing.bedrooms > 1 ? 's' : ''}`;
  if (listing.type === 'land') return `${listing.sqft.toLocaleString()} sqft`;
  return `${bedLabel} · ${listing.bathrooms} bath${listing.bathrooms !== 1 ? 's' : ''}`;
}

async function loadSavedHomes(uid, favoriteIds) {
  const grid = document.getElementById('saved-grid');
  const status = document.getElementById('saved-status');
  const empty = document.getElementById('saved-empty');

  if (favoriteIds.length === 0) {
    status.textContent = '';
    empty.hidden = false;
    return;
  }

  const listings = await fetchListingsByIds(favoriteIds);

  // Know which saved homes already have a buy request, so the button
  // can show "Requested" instead of letting someone submit twice.
  const existingRequestsSnap = await getDocs(query(collection(db, 'buyRequests'), where('userId', '==', uid)));
  const requestedListingIds = new Set();
  existingRequestsSnap.forEach((docSnap) => requestedListingIds.add(docSnap.data().listingId));

  status.textContent = `${listings.length} saved propert${listings.length === 1 ? 'y' : 'ies'}`;

  listings.forEach((listing) => {
    const alreadyRequested = requestedListingIds.has(listing.id);
    const wrapper = document.createElement('div');
    wrapper.className = 'saved-home-card';
    wrapper.innerHTML = `
      <article class="portfolio-card">
        <a href="listing-detail.html?id=${listing.id}">
          <img src="${listing.images[0]}" alt="${listing.title}" loading="lazy" />
          <div class="portfolio-overlay">
            <span class="portfolio-price">${formatPrice(listing.price)}</span>
            <h3>${listing.title}</h3>
            <p>${listing.location} · ${specsLine(listing)}</p>
          </div>
        </a>
        <button class="favorite-toggle favorite-toggle--card" aria-pressed="true" aria-label="Remove from saved homes">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="1.6">
            <path d="M12 20.5s-7-4.35-9.5-8.8C.7 8.2 2.2 4.8 5.6 4.1c2-.4 4 .5 5.2 2.2C12 4.6 14 3.7 16 4.1c3.4.7 4.9 4.1 3.1 7.6C19 16.15 12 20.5 12 20.5z"/>
          </svg>
        </button>
      </article>
      <button class="dashboard-buy-btn" ${alreadyRequested ? 'disabled' : ''}>
        ${alreadyRequested ? 'Requested' : 'Request to Buy'}
      </button>
    `;

    wrapper.querySelector('.favorite-toggle--card').addEventListener('click', async (e) => {
      e.preventDefault();
      await updateDoc(doc(db, 'users', uid), { favorites: arrayRemove(listing.id) });
      wrapper.remove();
      const remaining = grid.querySelectorAll('.saved-home-card').length;
      status.textContent = remaining ? `${remaining} saved propert${remaining === 1 ? 'y' : 'ies'}` : '';
      if (remaining === 0) empty.hidden = false;
    });

    const buyButton = wrapper.querySelector('.dashboard-buy-btn');
    buyButton.addEventListener('click', async () => {
      buyButton.disabled = true;
      buyButton.textContent = 'Requesting…';
      await addDoc(collection(db, 'buyRequests'), {
        listingId: listing.id,
        userId: uid,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      buyButton.textContent = 'Requested';
    });

    grid.appendChild(wrapper);
  });
}

// ===== Buy Requests (read-only list for the buyer) =====
async function loadBuyRequests(uid) {
  const status = document.getElementById('buy-status');
  const tableWrap = document.getElementById('buy-table-wrap');
  const tableBody = document.getElementById('buy-table-body');
  const empty = document.getElementById('buy-empty');

  const [listingsSnap, requestsSnap] = await Promise.all([
    getDocs(collection(db, 'listings')),
    getDocs(query(collection(db, 'buyRequests'), where('userId', '==', uid)))
  ]);

  const listingTitles = {};
  listingsSnap.forEach((docSnap) => { listingTitles[docSnap.id] = docSnap.data().title; });

  if (requestsSnap.empty) {
    status.textContent = '';
    empty.hidden = false;
    return;
  }

  status.textContent = `${requestsSnap.size} buy request${requestsSnap.size === 1 ? '' : 's'}`;
  tableWrap.hidden = false;

  requestsSnap.forEach((docSnap) => {
    const request = docSnap.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><a href="listing-detail.html?id=${request.listingId}">${listingTitles[request.listingId] || 'Unknown listing'}</a></td>
      <td style="text-transform: capitalize;">${request.status}</td>
      <td>${formatDate(request.createdAt)}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ===== Consultations =====
function initConsultationForm(uid) {
  const form = document.getElementById('consultation-form');
  if (currentUser.displayName) document.getElementById('consult-name').value = currentUser.displayName;
  if (currentUser.email) document.getElementById('consult-email').value = currentUser.email;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Requesting…';

    await addDoc(collection(db, 'consultations'), {
      userId: uid,
      name: document.getElementById('consult-name').value.trim(),
      email: document.getElementById('consult-email').value.trim(),
      preferredDate: document.getElementById('consult-date').value,
      preferredTime: document.getElementById('consult-time').value,
      message: document.getElementById('consult-message').value.trim(),
      status: 'pending',
      createdAt: serverTimestamp()
    });

    form.reset();
    if (currentUser.displayName) document.getElementById('consult-name').value = currentUser.displayName;
    if (currentUser.email) document.getElementById('consult-email').value = currentUser.email;
    submitButton.disabled = false;
    submitButton.textContent = 'Request Consultation';

    loadConsultations(uid);
  });
}

async function loadConsultations(uid) {
  const status = document.getElementById('consult-status');
  const tableWrap = document.getElementById('consult-table-wrap');
  const tableBody = document.getElementById('consult-table-body');

  const snap = await getDocs(query(collection(db, 'consultations'), where('userId', '==', uid)));
  tableBody.innerHTML = '';

  if (snap.empty) {
    status.textContent = 'No consultations booked yet.';
    tableWrap.hidden = true;
    return;
  }

  status.textContent = `${snap.size} consultation${snap.size === 1 ? '' : 's'}`;
  tableWrap.hidden = false;

  snap.forEach((docSnap) => {
    const c = docSnap.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${c.preferredDate} · ${c.preferredTime}</td>
      <td style="text-transform: capitalize;">${c.status}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ===== My Inquiries =====
async function loadInquiries(uid) {
  const status = document.getElementById('inquiries-status');
  const tableWrap = document.getElementById('inquiries-table-wrap');
  const tableBody = document.getElementById('inquiries-table-body');
  const empty = document.getElementById('inquiries-empty');

  const [listingsSnap, inquiriesSnap] = await Promise.all([
    getDocs(collection(db, 'listings')),
    getDocs(query(collection(db, 'inquiries'), where('userId', '==', uid)))
  ]);

  const listingTitles = {};
  listingsSnap.forEach((docSnap) => { listingTitles[docSnap.id] = docSnap.data().title; });

  if (inquiriesSnap.empty) {
    status.textContent = '';
    empty.hidden = false;
    return;
  }

  status.textContent = `${inquiriesSnap.size} inquir${inquiriesSnap.size === 1 ? 'y' : 'ies'}`;
  tableWrap.hidden = false;

  inquiriesSnap.forEach((docSnap) => {
    const inquiry = docSnap.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><a href="listing-detail.html?id=${inquiry.listingId}">${listingTitles[inquiry.listingId] || 'Unknown listing'}</a></td>
      <td>${inquiry.message.length > 60 ? inquiry.message.slice(0, 60) + '…' : inquiry.message}</td>
      <td style="text-transform: capitalize;">${inquiry.status}</td>
    `;
    tableBody.appendChild(row);
  });
}

requireBuyer(async (user) => {
  currentUser = user;
  document.getElementById('welcome-heading').textContent =
    `Welcome back${user.displayName ? ', ' + user.displayName.split(' ')[0] : ''}.`;

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const favoriteIds = userSnap.exists() ? (userSnap.data().favorites || []) : [];

  await loadOverview(user.uid, favoriteIds.length);
  await loadSavedHomes(user.uid, favoriteIds);
  await loadBuyRequests(user.uid);
  initConsultationForm(user.uid);
  await loadConsultations(user.uid);
  await loadInquiries(user.uid);
});