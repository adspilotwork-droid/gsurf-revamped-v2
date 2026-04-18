/* ==========================================================================
   GSurf — Firebase Firestore contact form handler
   --------------------------------------------------------------------------
   Handles submission of the Site Survey form across all 16 pages.
   Writes to a Firestore collection named `site_surveys`.

   Firebase project: gsurf-database
   Analytics ID:     G-S45YZWPJLE

   DEPLOYMENT CHECKLIST:
   [x] Firebase config in place (below)
   [ ] Firestore enabled in asia-south1 (Mumbai) via Firebase Console
   [ ] Security rules deployed from firestore.rules via Firebase Console
   [ ] Domain www.gsurf.in added to Authorized domains
   ========================================================================== */

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAnalytics, isSupported }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js';

/* -------------------------------------------------------------
   FIREBASE CONFIG — gsurf-database project
   Note: This config is not secret. The apiKey is designed to be
   visible in frontend code. Security is enforced by Firestore rules
   (see firestore.rules). See: https://firebase.google.com/docs/projects/api-keys
   ------------------------------------------------------------- */
const firebaseConfig = {
  apiKey:            "AIzaSyB9A-Dcl8aQOgFvwr_-WGKkPyppQdATHjM",
  authDomain:        "gsurf-database.firebaseapp.com",
  projectId:         "gsurf-database",
  storageBucket:     "gsurf-database.firebasestorage.app",
  messagingSenderId: "327752358612",
  appId:             "1:327752358612:web:79244f3e56f83012067941",
  measurementId:     "G-S45YZWPJLE"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// Analytics is optional — only loads if environment supports it
isSupported().then(ok => { if (ok) getAnalytics(app); });

/* -------------------------------------------------------------
   FORM HANDLER — runs on every page that has .survey-form
   ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.survey-form');
  if (!form) return;

  const submitBtn = form.querySelector('.submit-btn');
  const originalBtnText = submitBtn?.textContent ?? 'Request Site Survey';

  // Remove the inline onsubmit handler from index.html/other pages
  form.onsubmit = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const fd = new FormData(form);
    const data = {
      name:     (fd.get('name')    || '').trim(),
      company:  (fd.get('company') || '').trim(),
      phone:    (fd.get('phone')   || '').trim(),
      email:    (fd.get('email')   || '').trim(),
      address:  (fd.get('address') || '').trim(),
      pincode:  (fd.get('pincode') || '').trim(),
      segment:  (fd.get('segment') || '').trim(),
      teamSize: (fd.get('users')   || '').trim(),
      notes:    (fd.get('notes')   || '').trim(),
    };

    // Lightweight client-side validation
    if (!data.name || !data.phone || !data.email || !data.address || !data.pincode) {
      showMessage(form, 'Please complete all required fields marked with *.', 'error');
      return;
    }
    if (!/^[0-9]{6}$/.test(data.pincode)) {
      showMessage(form, 'Please enter a valid 6-digit pincode.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showMessage(form, 'Please enter a valid email address.', 'error');
      return;
    }

    // Metadata (not user-editable, server-side context)
    const submission = {
      ...data,
      submittedAt: serverTimestamp(),
      source: {
        page:       window.location.pathname,
        referrer:   document.referrer || null,
        userAgent:  navigator.userAgent,
      },
      status: 'new',
    };

    // Lock the button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      await addDoc(collection(db, 'site_surveys'), submission);
      form.reset();
      showMessage(
        form,
        `Thanks ${data.name.split(' ')[0]} — we've received your request and will be in touch within 48 hours.`,
        'success'
      );
    } catch (err) {
      console.error('Firestore write failed:', err);
      showMessage(
        form,
        'Something went wrong. Please try again, or call us directly on +91 73386 85258.',
        'error'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
});

/* -------------------------------------------------------------
   Simple message banner above the submit button
   ------------------------------------------------------------- */
function showMessage(form, text, type) {
  let banner = form.querySelector('.form-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'form-banner';
    form.querySelector('.submit-btn').insertAdjacentElement('beforebegin', banner);
  }
  banner.textContent = text;
  banner.dataset.type = type;   // styled via CSS [data-type="success"|"error"]

  if (type === 'success') {
    // Scroll form into view so user sees the confirmation
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { banner?.remove(); }, 12000);
  }
}
