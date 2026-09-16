import { db } from '../js/firebase-config.js';
import { requireAdmin } from '../js/auth-guard.js';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const tableBody = document.getElementById('admin-table-body');
const statusLine = document.getElementById('admin-status');

function formatDate(timestamp) {
  if (!timestamp) return '—';
  return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderRow(request, listingTitle) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>
      <div class="admin-table-title">${request.name}</div>
      <div>${request.email}</div>
    </td>
    <td><a href="../listing-detail.html?id=${request.listingId}">${listingTitle}</a></td>
    <td>
      <select class="admin-status-select">
        <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="contacted" ${request.status === 'contacted' ? 'selected' : ''}>Contacted</option>
        <option value="closed" ${request.status === 'closed' ? 'selected' : ''}>Closed</option>
      </select>
    </td>
    <td>${formatDate(request.createdAt)}</td>
    <td>
      <div class="admin-row-actions">
        <button type="button">Delete</button>
      </div>
    </td>
  `;

  row.querySelector('.admin-status-select').addEventListener('change', async (e) => {
    await updateDoc(doc(db, 'buyRequests', request.id), { status: e.target.value });
  });

  row.querySelector('button').addEventListener('click', async () => {
    if (!confirm(`Delete this buy request from ${request.name}?`)) return;
    await deleteDoc(doc(db, 'buyRequests', request.id));
    row.remove();
    updateStatusLine();
  });

  tableBody.appendChild(row);
}

function updateStatusLine() {
  const count = tableBody.querySelectorAll('tr').length;
  statusLine.textContent = count ? `${count} buy request${count === 1 ? '' : 's'}` : 'No buy requests yet.';
}

requireAdmin(async () => {
  const [listingsSnap, requestsSnap] = await Promise.all([
    getDocs(collection(db, 'listings')),
    getDocs(collection(db, 'buyRequests'))
  ]);

  const listingTitles = {};
  listingsSnap.forEach((docSnap) => {
    listingTitles[docSnap.id] = docSnap.data().title;
  });

  tableBody.innerHTML = '';
  requestsSnap.forEach((docSnap) => {
    const request = { id: docSnap.id, ...docSnap.data() };
    renderRow(request, listingTitles[request.listingId] || 'Unknown listing');
  });

  updateStatusLine();
});