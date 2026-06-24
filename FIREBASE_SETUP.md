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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    // users/{userId} — each user can read/write their own doc; admins can read all
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow read: if isAdmin();
    }

    // policies/{policyId} — agents read/write their own policies; clients read their own
    match /policies/{policyId} {
      allow read: if isSignedIn() && (
        resource.data.agentId == request.auth.uid ||
        resource.data.clientId == request.auth.uid
      );
      allow create: if isAdmin();
      allow update, delete: if isAdmin() && resource.data.agentId == request.auth.uid;

      // statusHistory — only agents can write; policy access rules apply for read
      match /statusHistory/{entryId} {
        allow read: if isSignedIn() && (
          get(/databases/$(database)/documents/policies/$(policyId)).data.agentId == request.auth.uid ||
          get(/databases/$(database)/documents/policies/$(policyId)).data.clientId == request.auth.uid
        );
        allow write: if isAdmin() &&
          get(/databases/$(database)/documents/policies/$(policyId)).data.agentId == request.auth.uid;
      }
    }

    // reminders — agents read/write their portfolio reminders; clients read their own
    match /reminders/{reminderId} {
      allow read: if isSignedIn() && (
        resource.data.agentId == request.auth.uid ||
        resource.data.clientId == request.auth.uid
      );
      allow create, update: if isAdmin();
      allow update: if isSignedIn() && resource.data.clientId == request.auth.uid
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
    }

    // clients — agents manage their own clients; clients read their own document
    match /clients/{clientId} {
      allow read: if isOwner(clientId) ||
        (isAdmin() && resource.data.agentId == request.auth.uid);
      allow create: if isAdmin();
      allow update: if isAdmin() && resource.data.agentId == request.auth.uid;
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
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ `.env` is in `.gitignore` — never commit this file to GitHub.
> For CI/CD, these values are stored as GitHub Secrets and Vercel Environment Variables.

---

## 11. Firebase Console Quick Links

| What | URL |
|---|---|
| Project overview | https://console.firebase.google.com/project/YOUR_PROJECT_ID/overview |
| Authentication | https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication |
| Firestore | https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore |
| Security Rules | https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/rules |
| Project Settings | https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general |
