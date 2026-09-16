import { db } from '../js/firebase-config.js';
import { requireAdmin } from '../js/auth-guard.js';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../js/cloudinary-config.js';
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const listingId = params.get('id');
const isEditMode = Boolean(listingId);

const form = document.getElementById('listing-form');
const errorBox = document.getElementById('form-error');
const submitButton = document.getElementById('submit-button');
const imageInput = document.getElementById('field-images');
const uploadStatus = document.getElementById('upload-status');
const imagePreview = document.getElementById('image-preview');

let uploadedImages = [];

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
}

// ===== Cloudinary upload (unsigned) =====
// Each file is uploaded directly from the browser to Cloudinary —
// no backend involved, which is exactly what an unsigned upload
// preset is for. Safe here because this form only ever renders
// after requireAdmin() confirms an admin session.
async function uploadFileToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('Upload failed. Check your Cloudinary config and upload preset.');
  }

  const data = await response.json();
  return data.secure_url;
}

function renderImagePreview() {
  imagePreview.innerHTML = '';

  uploadedImages.forEach((url, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'admin-image-thumb';
    thumb.innerHTML = `
      <img src="${url}" alt="" />
      <button type="button" aria-label="Remove photo">×</button>
    `;
    thumb.querySelector('button').addEventListener('click', () => {
      uploadedImages.splice(index, 1);
      renderImagePreview();
    });
    imagePreview.appendChild(thumb);
  });
}

imageInput.addEventListener('change', async () => {
  const files = Array.from(imageInput.files);
  if (files.length === 0) return;

  imageInput.disabled = true;

  for (let i = 0; i < files.length; i++) {
    uploadStatus.textContent = `Uploading ${i + 1} of ${files.length}…`;
    try {
      const url = await uploadFileToCloudinary(files[i]);
      uploadedImages.push(url);
      renderImagePreview();
    } catch (err) {
      uploadStatus.textContent = err.message;
    }
  }

  uploadStatus.textContent = uploadedImages.length ? 'Upload complete.' : '';
  imageInput.disabled = false;
  imageInput.value = ''; // allows re-selecting the same file later if needed
});

function fillFormFromListing(listing) {
  document.getElementById('field-title').value = listing.title || '';
  document.getElementById('field-price').value = listing.price ?? '';
  document.getElementById('field-location').value = listing.location || '';
  document.getElementById('field-type').value = listing.type || 'apartment';
  document.getElementById('field-bedrooms').value = listing.bedrooms ?? 0;
  document.getElementById('field-bathrooms').value = listing.bathrooms ?? 0;
  document.getElementById('field-sqft').value = listing.sqft ?? '';
  document.getElementById('field-status').value = listing.status || 'available';
  document.getElementById('field-featured').checked = Boolean(listing.featured);
  document.getElementById('field-description').value = listing.description || '';

  uploadedImages = Array.isArray(listing.images) ? [...listing.images] : [];
  renderImagePreview();
}

function readFormValues() {
  return {
    title: document.getElementById('field-title').value.trim(),
    price: Number(document.getElementById('field-price').value),
    location: document.getElementById('field-location').value.trim(),
    type: document.getElementById('field-type').value,
    bedrooms: Number(document.getElementById('field-bedrooms').value),
    bathrooms: Number(document.getElementById('field-bathrooms').value),
    sqft: Number(document.getElementById('field-sqft').value),
    status: document.getElementById('field-status').value,
    featured: document.getElementById('field-featured').checked,
    description: document.getElementById('field-description').value.trim(),
    images: uploadedImages
  };
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const values = readFormValues();

  if (values.images.length === 0) {
    showError('Please upload at least one photo before saving.');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = isEditMode ? 'Updating…' : 'Adding…';

  try {
    if (isEditMode) {
      await updateDoc(doc(db, 'listings', listingId), values);
    } else {
      await addDoc(collection(db, 'listings'), values);
    }
    window.location.href = 'listings.html';
  } catch (err) {
    showError('Something went wrong saving this listing. Please try again.');
    submitButton.disabled = false;
    submitButton.textContent = isEditMode ? 'Update Listing' : 'Add Listing';
  }
});

requireAdmin(async () => {
  if (!isEditMode) return; // add mode — form already starts blank

  document.getElementById('page-title').textContent = 'Edit Listing — Stonefield & Co.';
  document.getElementById('form-heading').textContent = 'Edit listing';
  submitButton.textContent = 'Update Listing';

  const snap = await getDoc(doc(db, 'listings', listingId));
  if (!snap.exists()) {
    showError('This listing could not be found. It may have already been deleted.');
    form.hidden = true;
    return;
  }

  fillFormFromListing(snap.data());
});