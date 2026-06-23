# PolicyHub — Architecture & Flow Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Auth Flows](#auth-flows)
5. [Role-Based Access Control](#role-based-access-control)
6. [Data Flow](#data-flow)
7. [Firebase Architecture](#firebase-architecture)
8. [Component Architecture](#component-architecture)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Testing Strategy](#testing-strategy)
11. [How to Test Features Manually](#how-to-test-features-manually)

---

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                React 18 + Vite (Browser)             │
│                                                      │
│  AuthContext → ProtectedRoute → Pages               │
│       ↕                ↕            ↕               │
│  auth.service    firestore.service  usePolicies     │
└──────────────────────┬──────────────────────────────┘
                       │ Firebase SDK (HTTPS)
┌──────────────────────▼──────────────────────────────┐
│                  Firebase Cloud                      │
│  ┌─────────────┐         ┌──────────────────────┐   │
│  │  Auth       │         │  Firestore DB         │   │
│  │  email/pass │         │  users/{uid}          │   │
│  │  Google     │         │  policies/{policyId}  │   │
│  │  GitHub     │         └──────────────────────┘   │
│  └─────────────┘                                     │
└─────────────────────────────────────────────────────┘
```

No backend server. React talks directly to Firebase via the JavaScript SDK running in the browser.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | React 18 + Vite | Component rendering, fast HMR |
| Routing | React Router v6 | Client-side navigation, protected routes |
| Styling | Bootstrap 5.3 | Responsive UI, no custom CSS needed |
| Authentication | Firebase Auth 10 | Email/password, Google, GitHub OAuth |
| Database | Firestore | User profiles, roles, policies |
| Testing | Vitest + React Testing Library | Unit + component tests |
| Linting | ESLint + Prettier | Code quality + formatting |
| CI/CD | GitHub Actions | Auto lint/test/deploy |
| Hosting | Vercel | CDN, preview URLs, production deploys |

---

## Project Structure

```
workforce-practice/
├── .github/workflows/
│   ├── ci.yml              # Runs on every push/PR: lint + test
│   └── deploy.yml          # Runs on main merge: build + deploy to Vercel
├── src/
│   ├── firebase.js         # Firebase app init (reads from .env)
│   ├── main.jsx            # React root, Bootstrap import
│   ├── App.jsx             # BrowserRouter + all Routes defined
│   │
│   ├── context/
│   │   └── AuthContext.jsx # Global auth state: user, role, loading
│   │
│   ├── components/
│   │   └── ProtectedRoute.jsx  # Route guard: checks auth + role
│   │
│   ├── services/           # All Firebase calls live here, never in components
│   │   ├── auth.service.js       # register, login, OAuth, logout
│   │   └── firestore.service.js  # createUserDoc, getUserDoc, getPolicies, getUsers
│   │
│   ├── hooks/
│   │   └── usePolicies.js  # Role-aware Firestore query hook
│   │
│   ├── pages/
│   │   ├── Login.jsx           # Public: email/pass form + OAuth buttons
│   │   ├── Register.jsx        # Public: name/email/password form
│   │   ├── UserDashboard.jsx   # Protected (USER): assigned policies
│   │   ├── AdminDashboard.jsx  # Protected (ADMIN): stats + all data
│   │   └── Unauthorized.jsx    # Public: 403 page
│   │
│   └── __tests__/
│       ├── setup.js
│       ├── firebase.mock.js        # Mocks all Firebase modules
│       ├── auth.service.test.js
│       ├── AuthContext.test.jsx
│       └── ProtectedRoute.test.jsx
├── .env                    # Real Firebase credentials (gitignored)
├── .env.example            # Template for new developers
├── .gitignore              # Excludes .env, node_modules, dist
├── vercel.json             # SPA routing fix for Vercel
├── vite.config.js          # Vite + Vitest config
└── README.md
```

---

## Auth Flows

### Register (Email/Password)

```
1. User fills name + email + password on /register
2. auth.service.register()
   → Firebase: createUserWithEmailAndPassword(email, password)
   → Firebase: updateProfile(user, { displayName: name })
   → firestore.service.createUserDoc(user, { provider: "local" })
      → Checks if users/{uid} exists already
      → If not: writes { uid, email, name, role: "USER", provider, createdAt }
3. onAuthStateChanged fires automatically
   → Fetches users/{uid} from Firestore
   → Sets user + role in AuthContext
4. React redirects → /dashboard
```

### Login (Email/Password)

```
1. User fills email + password on /login
2. auth.service.login()
   → Firebase: signInWithEmailAndPassword(email, password)
3. onAuthStateChanged fires
   → Fetches role from users/{uid} in Firestore
   → Sets user + role in AuthContext
4. isAdmin() === true  → redirect /admin
   isAdmin() === false → redirect /dashboard
```

### OAuth (Google / GitHub)

```
1. User clicks "Continue with Google" or "Continue with GitHub"
2. auth.service.loginWithGoogle() / loginWithGithub()
   → Firebase: signInWithPopup(provider)
   → A popup window opens → user approves
   → Firebase returns user object with email + displayName
3. firestore.service.createUserDoc()
   → Checks if users/{uid} already exists
   → If YES: does nothing (preserves existing role)
   → If NO: creates doc with role: "USER", provider: "google"/"github"
4. onAuthStateChanged fires → role loaded → redirect
```

### Logout

```
1. User clicks "Sign out"
2. auth.service.logout() → Firebase: signOut()
3. onAuthStateChanged fires with null
4. AuthContext: user = null, role = null
5. ProtectedRoute detects no user → redirects to /login
```

### Auth State Persistence (Page Refresh)

```
1. User refreshes the browser
2. AuthProvider mounts → loading = true → shows spinner
3. onAuthStateChanged fires (Firebase reads from localStorage automatically)
   → If session valid: restores user, fetches role from Firestore
   → If session expired: returns null
4. loading = false → correct page renders
```

---

## Role-Based Access Control

### Roles

| Role | Access | Assigned |
|---|---|---|
| `USER` | `/dashboard` — sees own assigned policies only | Default on register |
| `ADMIN` | `/admin` — sees all policies, all users, stats | Manually set in Firestore |

### How roles are stored

Roles live in Firestore, not in Firebase Auth tokens:

```
Firestore: users/{uid}
{
  uid: "abc123",
  email: "jane@example.com",
  name: "Jane Smith",
  role: "USER",          ← this field controls access
  provider: "local",
  createdAt: timestamp
}
```

### ProtectedRoute logic

```jsx
// App.jsx defines routes like this:
<Route element={<ProtectedRoute />}>               // any logged-in user
  <Route path="/dashboard" element={<UserDashboard />} />
</Route>

<Route element={<ProtectedRoute requiredRole="ADMIN" />}>  // ADMIN only
  <Route path="/admin" element={<AdminDashboard />} />
</Route>

// ProtectedRoute checks:
if (loading)              → show spinner
if (!user)                → redirect /login
if (role !== requiredRole)→ redirect /unauthorized
else                      → render the page
```

### How to promote a USER to ADMIN

1. Firebase Console → Firestore Database → `users` collection
2. Find the user document (match by email field)
3. Click the `role` field → Edit → change `USER` to `ADMIN`
4. User gets admin access on next login

---

## Data Flow

### usePolicies Hook

```
Component mounts (UserDashboard or AdminDashboard)
       ↓
usePolicies() hook runs
       ↓
isAdmin() ?
  YES → getAllPolicies()
        Firestore: SELECT * FROM policies ORDER BY createdAt DESC
  NO  → getPoliciesForUser(uid)
        Firestore: SELECT * FROM policies WHERE assignedTo ARRAY_CONTAINS uid
       ↓
returns { policies, loading, error }
       ↓
Component renders cards / list
```

### Firestore Collections

**`users/{uid}`**
```
{
  uid:         string   — Firebase Auth UID
  email:       string   — user's email
  name:        string   — display name
  role:        string   — "USER" or "ADMIN"
  provider:    string   — "local", "google", or "github"
  createdAt:   timestamp
}
```

**`policies/{policyId}`**
```
{
  title:       string   — policy name
  description: string   — summary
  category:    string   — "HR", "IT", "Finance", "Legal"
  status:      string   — "active", "draft", "archived"
  assignedTo:  string[] — array of user UIDs who can see this policy
  createdBy:   string   — UID of creator
  createdAt:   timestamp
}
```

### Adding a test policy manually

1. Firebase Console → Firestore → `policies` collection → Add document
2. Add these fields:
   ```
   title:       "IT Security Policy"
   description: "Guidelines for secure system usage"
   category:    "IT"
   status:      "active"
   assignedTo:  ["YOUR_USER_UID"]   ← array field, paste your UID
   createdBy:   "YOUR_USER_UID"
   createdAt:   (timestamp — click timestamp type)
   ```
3. Your UID is in Firestore → `users` collection → your doc → `uid` field

---

## Firebase Architecture

### Why no backend?

The Firebase JavaScript SDK runs entirely in the browser. It communicates directly with Firebase's servers over HTTPS. No Express, no Spring Boot, no API layer needed.

```
Browser → Firebase SDK → Firebase Cloud
```

### Security

Access control is enforced by **Firestore Security Rules** (not by the app code). Even if someone bypasses the React UI, Firestore will reject unauthorized reads/writes.

```javascript
// Users can only read/write their own document
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Only logged-in users can read policies
// Only ADMINs can write policies
match /policies/{policyId} {
  allow read: if request.auth != null;
  allow write: if get(/databases/.../users/$(request.auth.uid)).data.role == 'ADMIN';
}
```

### Service Layer Pattern

All Firebase calls are isolated in `src/services/`. Components never import from `firebase/auth` or `firebase/firestore` directly.

```
Component → useAuth() hook → AuthContext → auth.service.js → Firebase
Component → usePolicies() hook → firestore.service.js → Firebase
```

This means if Firebase is ever swapped out, only the service files change.

---

## Component Architecture

```
App.jsx
└── BrowserRouter
    └── AuthProvider (AuthContext)
        ├── /login          → Login.jsx
        ├── /register       → Register.jsx
        ├── /unauthorized   → Unauthorized.jsx
        ├── ProtectedRoute (any auth)
        │   └── /dashboard  → UserDashboard.jsx
        │                      └── usePolicies() → firestore.service
        └── ProtectedRoute (ADMIN only)
            └── /admin      → AdminDashboard.jsx
                               ├── usePolicies() → firestore.service
                               └── getAllUsers() → firestore.service
```

---

## CI/CD Pipeline

```
Developer pushes code
        ↓
GitHub Actions: ci.yml triggers on ALL branches
├── npm ci
├── npm run lint    (ESLint)
└── npm run test    (Vitest — uses dummy Firebase env vars)

If branch = main:
        ↓
GitHub Actions: deploy.yml triggers
├── npm ci
├── npm run build   (Vite — uses real Firebase secrets from GitHub Secrets)
└── vercel --prod   (deploys dist/ to Vercel CDN)
        ↓
Live URL updated at your-app.vercel.app
```

### GitHub Secrets required for deploy

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project settings |
| `VITE_FIREBASE_*` (6 values) | Firebase Console → Project Settings |

---

## Testing Strategy

### What is tested

| File | Tests | What it covers |
|---|---|---|
| `auth.service.test.js` | 3 | login, register, logout call correct Firebase methods |
| `AuthContext.test.jsx` | 3 | loading state, user+role loaded, signed-out state |
| `ProtectedRoute.test.jsx` | 5 | spinner, /login redirect, /unauthorized redirect, role match |

### How Firebase is mocked

Tests never hit real Firebase. `firebase.mock.js` replaces all Firebase modules with `vi.fn()` stubs using Vitest's module mocking system.

```javascript
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
  // ...
}));
```

### Run tests

```bash
npm test              # run once, see pass/fail
npm run test:watch    # re-runs on file save
npm run test:coverage # shows % coverage per file
```
