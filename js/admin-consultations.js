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

function renderRow(consultation) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>
      <div class="admin-table-title">${consultation.name}</div>
      <div>${consultation.email}</div>
    </td>
    <td>${consultation.preferredDate} · ${consultation.preferredTime}</td>
    <td>${consultation.message ? (consultation.message.length > 50 ? consultation.message.slice(0, 50) + '…' : consultation.message) : '—'}</td>
    <td>
      <select class="admin-status-select">
        <option value="pending" ${consultation.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="confirmed" ${consultation.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
        <option value="completed" ${consultation.status === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
    </td>
    <td>
      <div class="admin-row-actions">
        <button type="button">Delete</button>
      </div>
    </td>
  `;

  row.querySelector('.admin-status-select').addEventListener('change', async (e) => {
    await updateDoc(doc(db, 'consultations', consultation.id), { status: e.target.value });
  });

  row.querySelector('button').addEventListener('click', async () => {
    if (!confirm(`Delete this consultation with ${consultation.name}?`)) return;
    await deleteDoc(doc(db, 'consultations', consultation.id));
    row.remove();
    updateStatusLine();
  });

  tableBody.appendChild(row);
}

function updateStatusLine() {
  const count = tableBody.querySelectorAll('tr').length;
  statusLine.textContent = count ? `${count} consultation${count === 1 ? '' : 's'}` : 'No consultations booked yet.';
}

requireAdmin(async () => {
  const snapshot = await getDocs(collection(db, 'consultations'));
  tableBody.innerHTML = '';

  snapshot.forEach((docSnap) => {
    renderRow({ id: docSnap.id, ...docSnap.data() });
  });

  updateStatusLine();
});