# Firebase Setup — What We Did (Step by Step)

This documents every manual step taken in the Firebase Console to set up the `InsuranceDemo` project for this app.

---

## 1. Created Firebase Project

- URL: [console.firebase.google.com](https://console.firebase.google.com)
- Clicked **Add project**
- Project name: `InsuranceDemo`
- Disabled Google Analytics (not needed)
- Clicked **Create project**
- Project ID assigned: `insurancedemo-b0141`

---

## 2. Registered Web App

- Firebase Console → Project Overview → clicked **</>** (Web app icon)
- App nickname: `workforce-practice-web`
- Clicked **Register app**
- Copied the Firebase config object:

```js
const firebaseConfig = {
  apiKey: "AIzaSyB3SEy3SQli7-ePuASmuSgFeoNADwkA1Gw",
  authDomain: "insurancedemo-b0141.firebaseapp.com",
  projectId: "insurancedemo-b0141",
  storageBucket: "insurancedemo-b0141.firebasestorage.app",
  messagingSenderId: "653594401002",
  appId: "1:653594401002:web:c33e646f3055a8870f9f93"
};
```

- Pasted these values into `workforce-practice/.env`

---

## 3. Enabled Authentication

- Firebase Console → left sidebar → **Authentication** → **Get started**
- Clicked **Sign-in method** tab
- Enabled the following providers:

### Email/Password
- Clicked **Email/Password** → toggled **Enable** → **Save**

### Google *(to be done when ready)*
- Click **Google** → toggle Enable → add support email → Save

### GitHub *(to be done when ready)*
- Requires a GitHub OAuth App first (see section 6 below)
- Click **GitHub** → paste Client ID + Secret from GitHub → Save

---

## 4. Created Firestore Database

- Firebase Console → left sidebar → **Firestore Database** → **Create database**
- Selected **Start in test mode** (open read/write for 30 days — good for development)
- Selected region: `us-central` (or nearest)
- Clicked **Done**

---

## 5. Set Firestore Security Rules

- Firebase Console → Firestore Database → **Rules** tab
- Replaced default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    match /policies/{policyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
  }
}
```

- Clicked **Publish** ✅

---

## 6. GitHub OAuth App *(when enabling GitHub login)*

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **App name:** `workforce-practice`
   - **Homepage URL:** `http://localhost:5173` (update to Vercel URL after deploy)
   - **Authorization callback URL:** copy from Firebase Console when enabling GitHub provider — looks like:
     `https://insurancedemo-b0141.firebaseapp.com/__/auth/handler`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** → copy the secret
7. Go back to Firebase Console → Authentication → GitHub provider → paste Client ID + Secret → **Save**

---

## 7. Add Authorized Domains *(after Vercel deploy)*

- Firebase Console → Authentication → **Settings** tab
- Scroll to **Authorized domains**
- `localhost` is already there by default (works for local dev)
- After deploying to Vercel: click **Add domain** → enter `your-app.vercel.app` → **Add**

---

## 8. What Gets Created Automatically

When a user registers via the app, these are created automatically — no manual setup needed:

**Firebase Auth** — a new Auth user record with email + UID

**Firestore `users/{uid}` document** — created by `firestore.service.js`:
```json
{
  "uid": "abc123xyz",
  "email": "user@example.com",
  "name": "Jane Smith",
  "role": "USER",
  "provider": "local",
  "createdAt": "2026-06-23T..."
}
```

---

## 9. How to Promote a User to ADMIN

1. Firebase Console → Firestore Database → `users` collection
2. Find the document matching the user's email
3. Click the `role` field → **Edit** → change `USER` → `ADMIN`
4. Click **Update**
5. User gets admin access on next login → lands on `/admin`

---

## 10. Environment Variables Used

These values from the Firebase config go into `workforce-practice/.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSyB3SEy3SQli7-ePuASmuSgFeoNADwkA1Gw
VITE_FIREBASE_AUTH_DOMAIN=insurancedemo-b0141.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=insurancedemo-b0141
VITE_FIREBASE_STORAGE_BUCKET=insurancedemo-b0141.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=653594401002
VITE_FIREBASE_APP_ID=1:653594401002:web:c33e646f3055a8870f9f93
```

> ⚠️ `.env` is in `.gitignore` — never commit this file to GitHub.
> For CI/CD, these values are stored as GitHub Secrets and Vercel Environment Variables.

---

## 11. Firebase Console Quick Links

| What | URL |
|---|---|
| Project overview | https://console.firebase.google.com/project/insurancedemo-b0141/overview |
| Authentication | https://console.firebase.google.com/project/insurancedemo-b0141/authentication |
| Firestore | https://console.firebase.google.com/project/insurancedemo-b0141/firestore |
| Security Rules | https://console.firebase.google.com/project/insurancedemo-b0141/firestore/rules |
| Project Settings | https://console.firebase.google.com/project/insurancedemo-b0141/settings/general |
