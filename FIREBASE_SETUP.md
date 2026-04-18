# Firebase Setup — GSurf Contact Form

This document tells you exactly how to wire up the contact form to your Firebase
Firestore database, step by step. Everything has been pre-built in the code —
you only need to paste credentials and deploy the security rules.

---

## Step 1 · Create your Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project**, call it something like `gsurf-production` or `gsurf-website`
3. Disable Google Analytics for now (you can turn it on later)
4. Wait for the project to be created

## Step 2 · Enable Firestore

1. In the left sidebar, click **Build → Firestore Database**
2. Click **Create database**
3. Pick **Production mode** (we will add rules in Step 4)
4. Pick region: **`asia-south1 (Mumbai)`** — lowest latency for Indian users
5. Click **Enable**

## Step 3 · Add a Web App & get your config

1. Firebase Console → Project Overview → click the **`</>`** (Web) icon
2. App nickname: `GSurf Website`
3. Leave "Also set up Firebase Hosting" **unchecked** (GitHub Pages handles hosting)
4. Click **Register app**
5. Copy the `firebaseConfig` object shown. It looks like this:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "gsurf-production.firebaseapp.com",
     projectId: "gsurf-production",
     storageBucket: "gsurf-production.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123def456ghi789",
     measurementId: "G-XXXXXXXXXX"
   };
   ```

## Step 4 · Paste the config into `firebase-form.js`

Open `firebase-form.js` in the project. Find the block marked
`FIREBASE CONFIG — REPLACE WITH YOUR PROJECT CREDENTIALS` near the top.
Replace all seven `REPLACE_WITH_YOUR_*` values with the actual values from
your Firebase config.

**Keep `measurementId` even if you disabled Analytics** — it's safe to leave
in; the analytics init only runs if the browser supports it.

> **Note on the API key:** Firebase web `apiKey` is *not secret* — it's
> designed to be exposed in frontend code. Security is enforced by the
> Firestore rules (Step 5), not by hiding the key. This is the standard
> Firebase pattern.

## Step 5 · Deploy the security rules

1. Open `firestore.rules` in the project
2. Copy the **entire file contents**
3. Firebase Console → Firestore Database → **Rules** tab
4. Paste over the existing default rules
5. Click **Publish**

### What the rules do

- **Anyone can submit a new survey** (public form, no auth needed)
- **Nobody can read, update, or delete from the client** — keeps form data private
- **Every submission is strictly validated** server-side:
  - Required fields present: name, phone, email, address, pincode
  - Pincode must be 6 digits
  - Email must match email pattern
  - Lengths capped (name ≤ 120, address ≤ 400, notes ≤ 2000)
  - No extra fields accepted
  - `status` locked to `'new'` on creation
- **Any submission failing validation is rejected** at the Firebase level

You view submissions via **Firebase Console → Firestore Database → Data tab → `site_surveys` collection**.

## Step 6 · Authorize your domain

Firebase restricts which domains can use your API key by default. Add your
production domain so the form works after deployment:

1. Firebase Console → Project Settings → **Authorized domains**
   (under Authentication → Settings)
2. Ensure your domain is added. The following should be allowed:
   - `localhost`
   - `www.gsurf.in`
   - `gsurf.in`
   - Your GitHub Pages domain if different (e.g. `yourname.github.io`)

> **Note:** Firestore itself doesn't use this list — it's for Firebase Auth.
> The Firestore rules in Step 5 are what protect your database.

## Step 7 · Test the integration

1. Push the site to GitHub Pages (or run it locally with `python3 -m http.server`)
2. Visit any page with the site survey form
3. Fill the form with test data:
   - Name: `Test User`
   - Phone: `+919999999999`
   - Email: `test@example.com`
   - Address: `Test address`
   - Pincode: `560066`
4. Submit. You should see a green success banner appear.
5. Verify in Firebase Console → Firestore Database → Data tab → `site_surveys`
   — your test submission should appear within seconds.

## Step 8 · Export submissions to a spreadsheet (optional)

Firebase Console has a built-in export, but for recurring exports the cleanest
path is:

1. Firebase Console → Project Settings → **Service accounts** → Generate new private key
2. Use a tool like `gcloud firestore export` or a Cloud Function on schedule
3. Or (simplest) write a small admin dashboard that reads the collection
   with an authenticated admin account

For a starting client, manual review in Firebase Console is fine. Move to
export/dashboards once submissions grow.

---

## Collection schema reference

Every document in `site_surveys` will have:

| Field         | Type       | Required | Notes                                      |
| ------------- | ---------- | -------- | ------------------------------------------ |
| `name`        | string     | yes      | 2 – 120 chars                              |
| `company`     | string     | no       | 0 – 120 chars                              |
| `phone`       | string     | yes      | 7 – 25 chars                               |
| `email`       | string     | yes      | must match email regex                     |
| `address`     | string     | yes      | 5 – 400 chars                              |
| `pincode`     | string     | yes      | exactly 6 digits                           |
| `segment`     | string     | no       | 0 – 60 chars (from dropdown)               |
| `teamSize`    | string     | no       | 0 – 30 chars (from dropdown)               |
| `notes`       | string     | no       | 0 – 2000 chars                             |
| `submittedAt` | timestamp  | yes      | server-set on submit                       |
| `status`      | string     | yes      | `'new'` on creation (update manually)      |
| `source`      | map        | yes      | `{ page, referrer, userAgent }`            |

---

## Troubleshooting

**The form submits but nothing appears in Firestore**
- Check browser console for errors. Most common: forgot to publish rules,
  or pincode wasn't 6 digits, or `status` wasn't exactly `'new'`.

**"Missing or insufficient permissions" error**
- Security rules haven't been published. Re-paste and publish via Firebase Console.

**Form hangs on "Submitting…" forever**
- Check that the Firebase config values in `firebase-form.js` are correct.
- Check that Firestore is enabled (Step 2) and not still provisioning.

**CORS errors in console**
- Add your domain to Authorized domains (Step 6).

**"Firebase: Error (auth/invalid-api-key)"**
- Your `apiKey` in firebase-form.js is wrong. Double-check it matches the
  config shown in Firebase Console.
