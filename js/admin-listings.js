import { db } from '../js/firebase-config.js';
import { requireAdmin } from '../js/auth-guard.js';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const tableBody = document.getElementById('admin-listings-body');
const statusLine = document.getElementById('admin-listings-status');

function formatPrice(value) {
  return '$' + value.toLocaleString('en-US');
}

function renderRow(listing) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><img class="admin-table-thumb" src="${listing.images[0]}" alt="${listing.title}" /></td>
    <td class="admin-table-title">${listing.title}</td>
    <td>${listing.location}</td>
    <td class="admin-table-price">${formatPrice(listing.price)}</td>
    <td>
      <select class="admin-status-select" data-id="${listing.id}">
        <option value="available" ${listing.status === 'available' ? 'selected' : ''}>Available</option>
        <option value="sold" ${listing.status === 'sold' ? 'selected' : ''}>Sold</option>
        <option value="rented" ${listing.status === 'rented' ? 'selected' : ''}>Rented</option>
      </select>
    </td>
    <td>
      <div class="admin-row-actions">
        <a href="listing-form.html?id=${listing.id}">Edit</a>
        <button type="button" data-id="${listing.id}" data-title="${listing.title}">Delete</button>
      </div>
    </td>
  `;

  row.querySelector('.admin-status-select').addEventListener('change', async (e) => {
    await updateDoc(doc(db, 'listings', listing.id), { status: e.target.value });
  });

  row.querySelector('button').addEventListener('click', async (e) => {
    const { id, title } = e.target.dataset;
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;

    await deleteDoc(doc(db, 'listings', id));
    row.remove();
    updateStatusLine();
  });

  tableBody.appendChild(row);
}

function updateStatusLine() {
  const count = tableBody.querySelectorAll('tr').length;
  statusLine.textContent = count
    ? `${count} listing${count === 1 ? '' : 's'}`
    : 'No listings yet. Add your first one.';
}

requireAdmin(async () => {
  const snapshot = await getDocs(collection(db, 'listings'));
  tableBody.innerHTML = '';

  snapshot.forEach((docSnap) => {
    renderRow({ id: docSnap.id, ...docSnap.data() });
  });

  updateStatusLine();
});