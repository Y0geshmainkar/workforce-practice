# PolicyHub — Insurance Policy Lifecycle Management

PolicyHub is a lightweight SaaS tool for independent insurance agents and small brokerages. It solves one real pain point: **agents lose track of which client policies are expiring, lapsing, or due for renewal — and miss the window to act.**

**Live demo:** _your Vercel URL here_

---

## What It Does

- Tracks the full lifecycle of every policy: Active → Pending Renewal → Lapsed / Cancelled / Expired
- Automatically flags policies expiring within 30 days as "Pending Renewal" on agent login
- Sends in-app reminders at 30-day, 7-day, and 1-day expiry thresholds (no duplicates)
- Logs every status change with a required reason — full audit trail per policy
- Lets clients log in and view only their own policies and renewal reminders

---

## Who It's For

| Persona | Role in app | What they see |
|---|---|---|
| Insurance Agent | ADMIN | All client policies, renewal alerts, status management, client list |
| Policyholder (Client) | USER | Their own policies, upcoming renewal dates, reminders |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 |
| Auth | Firebase Authentication (Email/Password, Google, GitHub OAuth) |
| Database | Cloud Firestore |
| Routing | React Router v6 |
| Testing | Vitest + React Testing Library |
| CI/CD | GitHub Actions → Vercel |

---

## Features

**Agent (ADMIN)**
- Dashboard with stat cards: Total | Active | Pending Renewal | Lapsed | Expiring This Month | Premium at Risk
- Red alert banner when any policy expires within 7 days
- Expiring Soon table — top 5 policies sorted by nearest expiry date
- Full policy list with filters (Type, Status, Insurer), sortable columns, Days Left color chip
- Create / edit policies with auto-calculated renewal date (30 days before expiry)
- Change policy status via modal — requires a reason note on every change
- Status history timeline on each policy detail page
- Client management: add and view policyholders
- Reminders grouped by type (30-day / 7-day / 1-day / manual)

**Client (USER)**
- View their own active policies in card layout
- Yellow banner for any policy expiring within 30 days
- In-app renewal reminders
- Read-only policy detail view

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/Y0geshmainkar/workforce-practice.git
cd workforce-practice
npm install
```

### 2. Create Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it `InsuranceDemo`
2. **Authentication** → Get started → enable: Email/Password, Google, GitHub
3. **Firestore Database** → Create database → Start in test mode
4. **Project Settings** → Your apps → Add web app → copy the config

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Apply Firestore security rules

Copy the rules from `FIREBASE_SETUP.md` and paste them into **Firebase Console → Firestore → Rules → Publish**.

### 5. Run

```bash
npm run dev
# → http://localhost:5173
```

### 6. Make yourself ADMIN

1. Register via the app
2. Firebase Console → Firestore → `users` collection → find your document
3. Change `role` field from `USER` → `ADMIN`
4. Re-login — you'll land on the Agent Dashboard

---

## Running Tests

```bash
npm test                # run all tests
npm run test:coverage   # with coverage report
npm run lint            # lint check
```

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users/{uid}` | Auth user profile + role |
| `policies/{policyId}` | Policy documents |
| `policies/{policyId}/statusHistory/{entryId}` | Audit trail for status changes |
| `reminders/{reminderId}` | Expiry reminders for agents and clients |
| `clients/{clientId}` | Policyholder profiles managed by agents |

---

## Firestore Security Rules

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

## Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add all `VITE_FIREBASE_*` env vars in **Vercel Dashboard → Settings → Environment Variables**.
After deploying, add your Vercel URL to **Firebase Console → Authentication → Authorized domains**.

---

## Project Structure

```
src/
├── components/
│   ├── AppLayout.jsx          # Sidebar + top bar shell
│   ├── StatusBadge.jsx        # Color-coded status chip
│   ├── DaysLeftBadge.jsx      # Days-remaining chip (red/amber/green)
│   ├── StatusChangeModal.jsx  # Status change with required reason
│   ├── EmptyState.jsx
│   ├── Skeleton.jsx
│   ├── ErrorBoundary.jsx
│   └── ProtectedRoute.jsx
├── context/
│   ├── AuthContext.jsx
│   └── ToastContext.jsx
├── hooks/
│   ├── usePolicies.js
│   ├── useClientPolicies.js
│   ├── usePolicyDetail.js
│   ├── useExpiringPolicies.js
│   ├── useClients.js
│   ├── useReminders.js
│   └── usePolicyStats.js
├── models/
│   └── schema.js              # Firestore document typedefs (JSDoc)
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── AgentDashboard.jsx
│   ├── ClientDashboard.jsx
│   ├── PolicyList.jsx
│   ├── PolicyDetail.jsx
│   ├── CreateEditPolicy.jsx
│   ├── ClientList.jsx
│   ├── AddClient.jsx
│   └── Reminders.jsx
├── services/
│   ├── auth.service.js
│   ├── firestore.service.js
│   └── renewal.service.js
└── dev/
    └── seedData.js            # Sample data for local testing
```
