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
  apiKey: "AIzaSyB9A-Dcl8aQOgFvwr_-WGKkPyppQdATHjM",
  authDomain: "gsurf-database.firebaseapp.com",
  projectId: "gsurf-database",
  storageBucket: "gsurf-database.firebasestorage.app",
  messagingSenderId: "327752358612",
  appId: "1:327752358612:web:79244f3e56f83012067941",
  measurementId: "G-S45YZWPJLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

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
      showThankYou(form, data.name);
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
   On success — replace the whole form with a thank-you card.
   This is clearer than a banner, prevents accidental re-submit,
   and avoids weird scroll behaviour.
   ------------------------------------------------------------- */
function showThankYou(form, fullName) {
  const firstName = (fullName || '').trim().split(/\s+/)[0] || 'there';

  const card = document.createElement('div');
  card.className = 'survey-form survey-thankyou';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.innerHTML = `
    <div class="thankyou-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
    <div class="form-title">Request received</div>
    <h3 class="thankyou-title">Thanks, ${escapeHtml(firstName)}. We've got your request.</h3>
    <p class="thankyou-body">
      A GSurf representative will reach out within <strong>48 hours</strong> to confirm serviceability
      at your address, recommend a plan, and schedule a site survey.
    </p>
    <p class="thankyou-body">
      In the meantime, if you need to reach us directly, sales is on
      <a href="tel:+917338685258">+91 73386 85258</a> (Mon&ndash;Sat, 9am&ndash;8pm)
      or <a href="mailto:bd@gaxiom.in">bd@gaxiom.in</a>.
    </p>
    <div class="thankyou-meta">
      <span>Reference: ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}</span>
    </div>
  `;

  // Swap form for thank-you card, preserving layout
  form.replaceWith(card);

  // Gently bring the card into view without flinging the scroll
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* -------------------------------------------------------------
   Error banner (used only on failure).
   ------------------------------------------------------------- */
function showMessage(form, text, type) {
  let banner = form.querySelector('.form-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'form-banner';
    form.querySelector('.submit-btn').insertAdjacentElement('beforebegin', banner);
  }
  banner.textContent = text;
  banner.dataset.type = type;
}
