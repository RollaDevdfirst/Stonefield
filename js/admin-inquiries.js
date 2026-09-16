import { db } from './firebase-config.js';
import { requireAdmin } from './auth-guard.js';
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

function renderRow(inquiry, listingTitle) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>
      <div class="admin-table-title">${inquiry.name}</div>
      <div>${inquiry.email}</div>
    </td>
    <td><a href="../listing-detail.html?id=${inquiry.listingId}">${listingTitle}</a></td>
    <td>${inquiry.message.length > 60 ? inquiry.message.slice(0, 60) + '…' : inquiry.message}</td>
    <td>
      <select class="admin-status-select">
        <option value="new" ${inquiry.status === 'new' ? 'selected' : ''}>New</option>
        <option value="responded" ${inquiry.status === 'responded' ? 'selected' : ''}>Responded</option>
      </select>
    </td>
    <td>
      <div class="admin-row-actions">
        <button type="button">Delete</button>
      </div>
    </td>
  `;

  row.querySelector('.admin-status-select').addEventListener('change', async (e) => {
    await updateDoc(doc(db, 'inquiries', inquiry.id), { status: e.target.value });
  });

  row.querySelector('button').addEventListener('click', async () => {
    if (!confirm(`Delete this inquiry from ${inquiry.name}?`)) return;
    await deleteDoc(doc(db, 'inquiries', inquiry.id));
    row.remove();
    updateStatusLine();
  });

  tableBody.appendChild(row);
}

function updateStatusLine() {
  const count = tableBody.querySelectorAll('tr').length;
  statusLine.textContent = count ? `${count} inquir${count === 1 ? 'y' : 'ies'}` : 'No inquiries yet.';
}

requireAdmin(async () => {
  const [listingsSnap, inquiriesSnap] = await Promise.all([
    getDocs(collection(db, 'listings')),
    getDocs(collection(db, 'inquiries'))
  ]);

  const listingTitles = {};
  listingsSnap.forEach((docSnap) => {
    listingTitles[docSnap.id] = docSnap.data().title;
  });

  tableBody.innerHTML = '';
  inquiriesSnap.forEach((docSnap) => {
    const inquiry = { id: docSnap.id, ...docSnap.data() };
    renderRow(inquiry, listingTitles[inquiry.listingId] || 'Unknown listing');
  });

  updateStatusLine();
});