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

/* -------------------------------------------------------------
   FIREBASE CONFIG — gsurf-database project
   Note: This config is not secret. The apiKey is designed to be
   visible in frontend code. Security is enforced by Firestore rules
   (see firestore.rules). See: https://firebase.google.com/docs/projects/api-keys
   ------------------------------------------------------------- */
// Import the functions you need from the SDKs you need

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

/* -------------------------------------------------------------
   STEP 1: Attach the form handler IMMEDIATELY (synchronously).
   This runs before any Firebase imports, so even if the CDN is
   blocked or slow, the form still captures the submit event and
   shows SOMETHING to the user instead of silently reloading.
   ------------------------------------------------------------- */
let firebaseReady = null; // Promise, resolved once SDK + db are ready

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.survey-form');
  if (!form) return;

  const submitBtn = form.querySelector('.submit-btn');
  const originalBtnText = submitBtn?.textContent ?? 'Request Site Survey';

  // Mark form as "JS-ready". The inline onsubmit handler in the HTML checks
  // this flag and only shows the "still loading" alert if we haven't got here yet.
  window.__gsurfFormReady = true;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();   // ← CRITICAL: stops the page-reload default

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

    // Client-side validation
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

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      // Wait for Firebase SDK to be ready (with 10s timeout so we never hang)
      const fb = await Promise.race([
        firebaseReady,
        new Promise((_, reject) => setTimeout(
          () => reject(new Error('Firebase SDK took too long to load')), 10000
        ))
      ]);

      if (!fb) throw new Error('Firebase SDK failed to initialise');

      const submission = {
        ...data,
        submittedAt: fb.serverTimestamp(),
        source: {
          page:      window.location.pathname,
          referrer:  document.referrer || null,
          userAgent: navigator.userAgent,
        },
        status: 'new',
      };

      await fb.addDoc(fb.collection(fb.db, 'site_surveys'), submission);
      showThankYou(form, data.name);

    } catch (err) {
      console.error('[GSurf form] Submission failed:', err);
      showMessage(
        form,
        'Something went wrong. Please try again in a moment, or call us directly on +91 73386 85258.',
        'error'
      );
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
});

/* -------------------------------------------------------------
   STEP 2: Load and initialise Firebase asynchronously.
   If this fails, the form handler above still catches the submit,
   validates, and shows the error banner — it never silently reloads.
   ------------------------------------------------------------- */
firebaseReady = (async () => {
  try {
    const [
      { initializeApp },
      { getFirestore, collection, addDoc, serverTimestamp },
      { getAnalytics, isSupported },
    ] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js'),
    ]);

    const app = initializeApp(firebaseConfig);
    const db  = getFirestore(app);

    // Analytics — only if supported in the current environment
    isSupported().then(ok => { if (ok) getAnalytics(app); }).catch(() => {});

    return { db, collection, addDoc, serverTimestamp };
  } catch (err) {
    console.error('[GSurf form] Firebase init failed:', err);
    return null;
  }
})();

/* -------------------------------------------------------------
   On success — replace the whole form with a thank-you card.
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

  form.replaceWith(card);
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

