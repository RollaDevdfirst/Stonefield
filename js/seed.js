import { db } from './firebase-config.js';
import { LISTINGS } from './listings-data.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const button = document.getElementById('seed-button');
const log = document.getElementById('seed-log');

function logLine(text) {
  log.textContent += text + '\n';
}

button.addEventListener('click', async () => {
  button.disabled = true;
  button.textContent = 'Seeding…';
  log.textContent = '';

  for (const listing of LISTINGS) {
    const { id, ...fields } = listing;
    try {
      await setDoc(doc(db, 'listings', id), fields);
      logLine(`✓ Added "${listing.title}" (id: ${id})`);
    } catch (err) {
      logLine(`✗ Failed on "${listing.title}": ${err.message}`);
    }
  }

  logLine('\nDone. You can delete seed.html and js/seed.js now, or leave them — they only run when you click the button.');
  button.textContent = 'Seeded';
});