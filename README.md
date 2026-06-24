# PolicyHub — Enterprise Policy Management Platform

A production-ready policy management app built with React 18, Firebase Auth, Firestore, and Bootstrap 5. Features email/password auth, Google + GitHub OAuth, and role-based access control (ADMIN / USER).

**Live demo:** _your Vercel URL here_

---

## Tech Stack

- React 18 + Vite
- Firebase 10 (Auth + Firestore)
- Bootstrap 5.3
- React Router v6
- Vitest + React Testing Library
- GitHub Actions CI/CD → Vercel

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/workforce-practice.git
cd workforce-practice
npm install
```

### 2. Create Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it `InsuranceDemo`
2. **Authentication** → Get started → enable:
   - Email/Password
   - Google (add your support email)
   - GitHub (see step 3)
3. **Firestore Database** → Create database → Start in test mode
4. **Project Settings** → Your apps → Add web app → copy the config

### 3. Enable GitHub OAuth

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
   - Homepage URL: `http://localhost:5173`
   - Callback URL: shown in Firebase console when enabling GitHub provider (looks like `https://insurancedemo-xxxxx.firebaseapp.com/__/auth/handler`)
2. Copy Client ID + Secret into Firebase → Authentication → GitHub provider

### 4. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase config values from Project Settings:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=insurancedemo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=insurancedemo
VITE_FIREBASE_STORAGE_BUCKET=insurancedemo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Run

```bash
npm run dev
# → http://localhost:5173
```

---

## Making a User ADMIN

1. Register a new account via the app
2. Go to [Firebase Console](https://console.firebase.google.com) → **Firestore Database** → `users` collection
3. Find the user document (by email)
4. Edit the `role` field: change `USER` → `ADMIN`
5. User will have admin access on next login

---

## Running Tests

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

---

## Deploy to Vercel

### Option A — Vercel CLI (quickest)

```bash
npm install -g vercel
vercel login
cd workforce-practice
vercel --prod
```

Add all `VITE_FIREBASE_*` env vars in **Vercel Dashboard → Settings → Environment Variables**.

### Option B — GitHub Actions (automatic on push to main)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → import the repo → note your **Org ID** and **Project ID** from Project Settings
3. Generate a Vercel token: [vercel.com/account/tokens](https://vercel.com/account/tokens)
4. Add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | your Vercel token |
| `VERCEL_ORG_ID` | from Vercel project settings |
| `VERCEL_PROJECT_ID` | from Vercel project settings |
| `VITE_FIREBASE_API_KEY` | Firebase config value |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase config value |
| `VITE_FIREBASE_PROJECT_ID` | Firebase config value |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase config value |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase config value |
| `VITE_FIREBASE_APP_ID` | Firebase config value |

Every push to `main` → auto-deploys. Every PR → runs lint + tests.

### Add production domain to Firebase

After deploying, go to **Firebase Console → Authentication → Settings → Authorized domains** → add your `xxx.vercel.app` URL.

---

## Firestore Security Rules

Replace the default rules in **Firestore → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if isAdmin();
    }
    match /policies/{policyId} {
      allow read: if isSignedIn() && (
        resource.data.agentId == request.auth.uid ||
        resource.data.clientId == request.auth.uid
      );
      allow create: if isAdmin();
      allow update, delete: if isAdmin() && resource.data.agentId == request.auth.uid;
      match /statusHistory/{entryId} {
        allow read: if isSignedIn();
        allow write: if isAdmin();
      }
    }
    match /reminders/{reminderId} {
      allow read: if isSignedIn() && (
        resource.data.agentId == request.auth.uid ||
        resource.data.clientId == request.auth.uid
      );
      allow create, update: if isAdmin();
    }
    match /clients/{clientId} {
      allow read: if request.auth.uid == clientId ||
        (isAdmin() && resource.data.agentId == request.auth.uid);
      allow create: if isAdmin();
      allow update: if isAdmin() && resource.data.agentId == request.auth.uid;
    }
  }
}
```

---

## Project Structure

```
workforce-practice/
├── .github/workflows/
│   ├── ci.yml          # lint + test on every push/PR
│   └── deploy.yml      # deploy to Vercel on merge to main
├── src/
│   ├── firebase.js
│   ├── main.jsx
│   ├── App.jsx
│   ├── context/AuthContext.jsx
│   ├── components/ProtectedRoute.jsx
│   ├── services/
│   │   ├── auth.service.js
│   │   └── firestore.service.js
│   ├── hooks/usePolicies.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── UserDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── Unauthorized.jsx
│   └── __tests__/
│       ├── setup.js
│       ├── firebase.mock.js
│       ├── auth.service.test.js
│       ├── AuthContext.test.jsx
│       └── ProtectedRoute.test.jsx
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── vercel.json
├── vite.config.js
└── package.json
```
