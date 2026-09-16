import { db } from './firebase-config.js';
import { requireAdmin } from './auth-guard.js';
import {
  collection,
  query,
  where,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

requireAdmin(async (user) => {
  document.getElementById('welcome-heading').textContent =
    `Welcome back${user.displayName ? ', ' + user.displayName.split(' ')[0] : ''}.`;

  const listingsRef = collection(db, 'listings');
  const inquiriesRef = collection(db, 'inquiries');
  const buyRequestsRef = collection(db, 'buyRequests');
  const consultationsRef = collection(db, 'consultations');

  const [totalSnap, availableSnap, newInquiriesSnap, buyRequestsSnap, consultationsSnap] = await Promise.all([
    getCountFromServer(listingsRef),
    getCountFromServer(query(listingsRef, where('status', '==', 'available'))),
    getCountFromServer(query(inquiriesRef, where('status', '==', 'new'))),
    getCountFromServer(query(buyRequestsRef, where('status', '==', 'pending'))),
    getCountFromServer(query(consultationsRef, where('status', '==', 'pending')))
  ]);

  document.getElementById('stat-total').textContent = totalSnap.data().count;
  document.getElementById('stat-available').textContent = availableSnap.data().count;
  document.getElementById('stat-inquiries').textContent = newInquiriesSnap.data().count;
  document.getElementById('stat-buy-requests').textContent = buyRequestsSnap.data().count;
  document.getElementById('stat-consultations').textContent = consultationsSnap.data().count;
});