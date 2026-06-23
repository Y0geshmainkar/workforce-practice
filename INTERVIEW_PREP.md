# Interview Prep — AuthContext, Firebase Auth & React Patterns

Everything in this document is based on the actual code in this project.

---

## PART 1 — How AuthContext Works (Concept Deep Dive)

### What is Context?

React Context is a way to share state across the entire component tree without passing props down manually at every level.

Without Context:
```
App → passes user as prop → Layout → passes user as prop → Navbar → uses user
```

With Context:
```
AuthProvider (wraps everything)
  └── Navbar → useAuth() → gets user directly
```

### Our AuthContext Flow (line by line)

```jsx
// 1. Create the context — just an empty container at this point
const AuthContext = createContext(null);

// 2. AuthProvider — wraps the whole app, holds all auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // Firebase user object
  const [role, setRole] = useState(null);   // "USER" or "ADMIN" from Firestore
  const [loading, setLoading] = useState(true); // true until Firebase responds

  useEffect(() => {
    // 3. onAuthStateChanged — Firebase calls this automatically:
    //    - on app load (checks localStorage for existing session)
    //    - when user logs in
    //    - when user logs out
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 4. User is logged in — fetch their role from Firestore
        const doc = await getUserDoc(firebaseUser.uid);
        setUser(firebaseUser);
        setRole(doc?.role ?? 'USER');
      } else {
        // 5. User is logged out
        setUser(null);
        setRole(null);
      }
      setLoading(false); // 6. Done — render the app
    });
    return unsubscribe; // 7. Cleanup — stop listening when component unmounts
  }, []); // 8. Empty array — runs only once on mount
```

### Why `loading` matters

Without loading state, on page refresh this happens:
```
1. App renders → user = null (initial state)
2. ProtectedRoute sees no user → redirects to /login  ← WRONG
3. Firebase responds → user is actually logged in
```

With loading state:
```
1. App renders → loading = true → show spinner
2. Firebase responds → user set → loading = false
3. ProtectedRoute now sees real user → correct page renders
```

### Why the login bug happened (and how we fixed it)

**The bug:**
```jsx
// WRONG — role is still null at this point
await login(email, password);
navigate(isAdmin() ? '/admin' : '/dashboard'); // isAdmin() = false always!
```

Firebase `signInWithEmailAndPassword` returns the user but does NOT update AuthContext immediately. `onAuthStateChanged` fires asynchronously after.

**The fix:**
```jsx
// CORRECT — wait for AuthContext to update
useEffect(() => {
  if (user && role) {  // fires when onAuthStateChanged updates context
    navigate(role === 'ADMIN' ? '/admin' : '/dashboard');
  }
}, [user, role]); // runs every time user or role changes
```

---

## PART 2 — Interview Questions & Answers

---

### React Context

**Q: What is React Context and when should you use it?**

A: Context provides a way to pass data through the component tree without prop drilling. Use it for global state that many components need — auth state, theme, language. Don't use it for state that only affects a small part of the UI — local `useState` is better there.

---

**Q: What's the difference between `createContext`, `Provider`, and `useContext`?**

A:
- `createContext(null)` — creates the context object with a default value
- `<AuthContext.Provider value={...}>` — makes the value available to all children
- `useContext(AuthContext)` — subscribes a component to the context value, re-renders when it changes

We export `useAuth()` as a custom hook that wraps `useContext(AuthContext)` to make it cleaner and allow adding error handling in one place.

---

**Q: What happens if a component calls `useAuth()` but is not inside `AuthProvider`?**

A: It gets the default value passed to `createContext()` — in our case `null`. That's why we initialize with `null` and not an empty object — it makes it obvious something is wrong. In production you'd throw an error inside `useAuth()` if context is null.

---

**Q: Why does `AuthProvider` render a spinner instead of children while loading?**

A: To prevent a flash of the wrong page. On refresh, `user` starts as `null` until Firebase checks localStorage. If we render children immediately, `ProtectedRoute` sees `user = null` and redirects to `/login` — even for a logged-in user. The spinner blocks rendering until Firebase resolves.

---

### useEffect & Subscriptions

**Q: Why is `onAuthStateChanged` inside a `useEffect`?**

A: `useEffect` runs after the component mounts. `onAuthStateChanged` sets up a persistent listener — it shouldn't run during render. Also, `useEffect` returns a cleanup function (`unsubscribe`) that stops the listener when the component unmounts, preventing memory leaks.

---

**Q: What does the empty dependency array `[]` mean in useEffect?**

A: It means the effect runs only once — after the first render (component mount). Without it, the effect would run after every render, creating a new Firebase listener each time. With `[]`, we create one listener for the lifetime of the app.

---

**Q: What is a memory leak in React and how does our code prevent it?**

A: A memory leak happens when a component unmounts but still has active listeners/subscriptions updating state. In our code:

```jsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, callback);
  return unsubscribe; // cleanup — Firebase stops the listener
}, []);
```

The returned `unsubscribe` function is called by React when `AuthProvider` unmounts, stopping the Firebase listener.

---

### Firebase Auth

**Q: What is `onAuthStateChanged` and why is it better than reading the user directly?**

A: `onAuthStateChanged` is a persistent observer that Firebase calls whenever auth state changes. It also fires on app load, checking if a valid session exists in localStorage/IndexedDB. Reading `auth.currentUser` directly is synchronous and can return `null` before Firebase has initialized — `onAuthStateChanged` guarantees you get the correct state.

---

**Q: How does Firebase persist login across page refreshes?**

A: By default, Firebase Auth uses `browserLocalPersistence` — it stores the auth token in `localStorage`. On page reload, Firebase reads it, validates it, and calls `onAuthStateChanged` with the user. No manual token management needed.

---

**Q: What's the difference between email/password auth and OAuth in Firebase?**

A:
- **Email/password:** Firebase stores a hashed password. You call `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`.
- **OAuth (Google/GitHub):** Firebase redirects to the provider's consent screen via `signInWithPopup`. The provider returns an OAuth token to Firebase, which creates/links a user account. No password stored.

In both cases, Firebase returns the same `User` object with a `uid`.

---

**Q: Why does `createUserDoc` check if the document exists before writing?**

A: To preserve the user's existing data — especially their `role`. OAuth users can sign in multiple times. Without the existence check, every Google login would overwrite `role: "ADMIN"` back to `role: "USER"`. 

```js
const snap = await getDoc(ref);
if (snap.exists()) return snap.data(); // don't overwrite
await setDoc(ref, { role: 'USER', ... }); // only for new users
```

---

### Role-Based Access Control (RBAC)

**Q: How is RBAC implemented in this app?**

A: Two layers:

1. **Frontend (React):** `ProtectedRoute` checks `role` from `AuthContext`. Wrong role → redirect to `/unauthorized`.
2. **Backend (Firestore Rules):** Even if someone bypasses React, Firestore rejects unauthorized reads/writes based on `request.auth.uid` and the user's stored role.

Frontend RBAC is for UX. Firestore rules are the real security.

---

**Q: Could someone bypass the ProtectedRoute by editing JavaScript in the browser?**

A: They could bypass the React redirect, but Firestore Security Rules run on Firebase's servers — they can't be bypassed from the browser. A USER trying to read all policies would get a "permission denied" error from Firestore regardless of what the React code does.

---

**Q: Why is role stored in Firestore instead of Firebase Auth custom claims?**

A: Firestore roles are simpler — no backend function needed to set claims. The tradeoff is that Firestore roles require an extra DB read on each auth state change. Custom claims are embedded in the JWT token so they're available instantly, but require Firebase Admin SDK (a backend) to set. For a portfolio app, Firestore roles are the right choice.

---

### React Router & Protected Routes

**Q: How does `ProtectedRoute` work with React Router v6?**

A: It uses the `<Outlet />` pattern. Instead of wrapping a component, it acts as a layout route. Child routes render inside `<Outlet />` only if auth checks pass.

```jsx
// App.jsx
<Route element={<ProtectedRoute requiredRole="ADMIN" />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>

// ProtectedRoute.jsx
if (!user) return <Navigate to="/login" replace />;
if (role !== requiredRole) return <Navigate to="/unauthorized" replace />;
return <Outlet />; // renders AdminDashboard here
```

---

**Q: What does `replace` do in `<Navigate replace />`?**

A: It replaces the current history entry instead of pushing a new one. Without it, clicking "back" after being redirected to `/login` would send the user back to the protected route (triggering another redirect). With `replace`, the protected route is not in the history stack.

---

### Service Layer Pattern

**Q: Why are all Firebase calls in `services/` files instead of directly in components?**

A: Separation of concerns:
- **Testability:** Services can be mocked in tests without touching components
- **Reusability:** Multiple components can use the same service function
- **Maintainability:** If Firebase changes its API, only service files need updating
- **Readability:** Components stay focused on UI, not data fetching logic

---

**Q: What is a custom hook and why did we create `usePolicies`?**

A: A custom hook is a function starting with `use` that calls other hooks. `usePolicies` encapsulates:
- Fetching the right data based on role (`getAllPolicies` vs `getPoliciesForUser`)
- Managing `loading` and `error` states
- Knowing which user is logged in

Without it, both `UserDashboard` and `AdminDashboard` would duplicate this logic. Custom hooks follow the DRY principle.

---

### Testing

**Q: How do you test code that depends on Firebase without hitting real Firebase?**

A: Module mocking. Vitest's `vi.mock()` intercepts the import and replaces it with a fake:

```js
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
  onAuthStateChanged: vi.fn(),
}));
```

Now when `auth.service.js` calls `signInWithEmailAndPassword`, it calls our fake instead of Firebase. Tests run instantly with no network calls.

---

**Q: What's the difference between `vi.fn()` and `vi.fn().mockResolvedValue()`?**

A:
- `vi.fn()` — creates a spy function that does nothing and returns `undefined`
- `vi.fn().mockResolvedValue(x)` — makes it return `Promise.resolve(x)` when called, simulating an async Firebase response

---

**Q: Why do we test `ProtectedRoute` with `MemoryRouter` instead of `BrowserRouter`?**

A: `MemoryRouter` keeps routing state in memory — no real browser URL changes. This makes tests predictable and runnable in jsdom (the simulated browser environment). `BrowserRouter` uses `window.location` which doesn't work properly in test environments.

---

## PART 3 — Concepts to Know for Interviews

| Concept | Where used in this app |
|---|---|
| React Context API | `AuthContext.jsx` |
| Custom hooks | `useAuth()`, `usePolicies()` |
| useEffect + cleanup | `onAuthStateChanged` subscription |
| Async/await + error handling | All service functions, form handlers |
| Firebase Auth persistence | Automatic via `onAuthStateChanged` |
| Firestore security rules | Server-side RBAC enforcement |
| Protected routes (React Router v6) | `ProtectedRoute.jsx` with `<Outlet />` |
| Service layer / separation of concerns | `services/` folder pattern |
| Module mocking in tests | `firebase.mock.js` with `vi.mock()` |
| CI/CD with GitHub Actions | `.github/workflows/ci.yml` |
| Environment variables in Vite | `import.meta.env.VITE_*` |
| Race condition (async state) | Login redirect bug + fix with useEffect |


---

## PART 4 — React Interview Questions (Tricky / Senior Level)

---

### Core React

**Q: What is the difference between controlled and uncontrolled components?**

A:
- **Controlled:** form value is driven by React state. Every keystroke calls `setState`. Source of truth is React.
- **Uncontrolled:** form value lives in the DOM. You read it with a `ref`. Source of truth is the DOM.

Our `Login.jsx` and `Register.jsx` are controlled:
```jsx
<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
```

---

**Q: What is reconciliation?**

A: The process React uses to diff the previous virtual DOM with the new one and figure out the minimum DOM updates needed. React compares elements by type and `key`. If type changes, the old tree is destroyed and rebuilt. If type is the same, React updates only changed props.

---

**Q: Why should you not mutate state directly?**

A: React uses shallow comparison to detect state changes. If you mutate an object/array directly, the reference stays the same — React thinks nothing changed and skips re-render.

```jsx
// WRONG — same reference, no re-render
state.name = 'new';
setState(state);

// CORRECT — new reference triggers re-render
setState({ ...state, name: 'new' });
```

---

**Q: What is the difference between `props` and `state`?**

A:
- `props` — passed from parent, read-only inside the component
- `state` — owned by the component, can be changed with `setState`/`useState`

A component re-renders when either changes.

---

**Q: What is a pure component / when does React skip re-rendering?**

A: A component is "pure" if same props → same output. React skips re-rendering children if their props haven't changed when using `React.memo`. Without `memo`, a parent re-render always re-renders all children regardless of props.

---

### Hooks

**Q: What are the rules of hooks?**

A:
1. Only call hooks at the **top level** — not inside loops, conditions, or nested functions
2. Only call hooks from **React functions** — not regular JS functions

Reason: React tracks hooks by call order. If you put a hook inside an `if`, the order can change between renders and React loses track.

---

**Q: What is the difference between `useState` and `useRef`?**

A:
- `useState` — changing it triggers a re-render
- `useRef` — changing `.current` does NOT trigger a re-render

Use `useRef` for: storing previous values, accessing DOM nodes, storing timers/intervals.

```jsx
const count = useRef(0);
count.current += 1; // no re-render
```

---

**Q: What is `useCallback` and when do you need it?**

A: `useCallback` memoizes a function so it keeps the same reference between renders. You need it when:
1. Passing a function as prop to a `React.memo` child — prevents unnecessary re-renders
2. A function is in a `useEffect` dependency array — prevents infinite loops

```jsx
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]); // only recreates if id changes
```

---

**Q: What is `useMemo` and how is it different from `useCallback`?**

A:
- `useMemo` — memoizes a **value** (result of computation)
- `useCallback` — memoizes a **function**

```jsx
const filtered = useMemo(() => policies.filter(p => p.status === 'active'), [policies]);
const handler = useCallback(() => doThing(), [dep]);
```

Both only recompute when dependencies change.

---

**Q: Explain the useEffect dependency array. What happens with each case?**

A:
```jsx
useEffect(() => { ... });          // runs after EVERY render
useEffect(() => { ... }, []);      // runs ONCE after mount
useEffect(() => { ... }, [value]); // runs when value changes
```

Missing a dependency causes stale closure bugs — the effect uses an old version of the variable. ESLint's `exhaustive-deps` rule catches this.

---

**Q: What is a stale closure in React?**

A: When a function "closes over" a variable at a point in time and doesn't see later updates.

```jsx
// Bug: count is 0 when the effect runs, closure captures 0 forever
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // always prints 0
  }, 1000);
  return () => clearInterval(timer);
}, []); // missing count in deps
```

Fix: add `count` to the dependency array, or use a `useRef`.

---

**Q: What is the difference between `useEffect` and `useLayoutEffect`?**

A:
- `useEffect` — runs **after** the browser paints. Non-blocking. Use for data fetching, subscriptions.
- `useLayoutEffect` — runs **before** the browser paints, synchronously. Use for DOM measurements to avoid visual flicker.

99% of cases use `useEffect`.

---

**Q: Can you call `setState` inside `useEffect`? What's the danger?**

A: Yes, but it can cause infinite loops:

```jsx
// INFINITE LOOP — effect sets state, re-render triggers effect, repeat
useEffect(() => {
  setCount(count + 1);
}, [count]); // count changes → effect runs → count changes → ...
```

Safe pattern — use a function update or correct dependencies:
```jsx
useEffect(() => {
  setCount(c => c + 1); // only runs once with []
}, []);
```

---

**Q: What is the `useReducer` hook and when would you use it over `useState`?**

A: `useReducer` manages complex state with a reducer function `(state, action) => newState`. Use it when:
- State has multiple sub-values that change together
- Next state depends on previous state in complex ways
- You want Redux-like patterns without Redux

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'LOGIN', payload: user });
```

Our `AuthContext` could use `useReducer` instead of 3 separate `useState` calls.

---

**Q: What is `useContext` and what are its performance implications?**

A: `useContext` subscribes a component to a context. Every time the context value changes, **all** consumers re-render — even if only part of the value changed.

Fix: split contexts (separate `AuthUserContext` and `AuthRoleContext`), or memoize the value:

```jsx
const value = useMemo(() => ({ user, role, login, logout }), [user, role]);
```

---

### Component Patterns

**Q: What is prop drilling and how do you solve it?**

A: Prop drilling is passing props through multiple intermediate components that don't use them, just to reach a deeply nested child.

Solutions:
1. **React Context** — what we use in this app
2. **Component composition** — pass components as children instead of data
3. **State management library** — Zustand, Redux

---

**Q: What is the difference between `React.memo`, `useMemo`, and `useCallback`?**

A:
- `React.memo` — HOC that skips re-rendering a **component** if props haven't changed
- `useMemo` — memoizes a **computed value** inside a component
- `useCallback` — memoizes a **function** inside a component

```jsx
const Child = React.memo(({ onClick }) => <button onClick={onClick}>Click</button>);
// Without useCallback, onClick is a new function every render → Child always re-renders
const onClick = useCallback(() => doThing(), []);
```

---

**Q: What is the children prop?**

A: Everything between opening and closing JSX tags is passed as `props.children`.

```jsx
<AuthProvider>
  <App />   // ← this is children
</AuthProvider>

function AuthProvider({ children }) {
  return <AuthContext.Provider value={...}>{children}</AuthContext.Provider>;
}
```

---

**Q: What is lazy loading / code splitting in React?**

A: Splitting the bundle so users only download the code for the page they're on.

```jsx
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

<Suspense fallback={<div>Loading...</div>}>
  <AdminDashboard />
</Suspense>
```

Useful in our app — `AdminDashboard` is only needed by admins, no reason to load it for all users.

---

**Q: What is the virtual DOM?**

A: A lightweight JavaScript representation of the real DOM kept in memory. When state changes, React:
1. Creates a new virtual DOM tree
2. Diffs it against the previous one (reconciliation)
3. Applies only the changed parts to the real DOM (commit phase)

This is faster than directly manipulating the DOM on every state change.

---

### Performance

**Q: How would you optimize a React app that is re-rendering too much?**

A:
1. `React.memo` on expensive child components
2. `useCallback` on functions passed as props
3. `useMemo` on expensive calculations
4. Split context into smaller pieces
5. Virtualize long lists (`react-window`)
6. Lazy load routes and heavy components
7. Move state down — keep state as close to where it's used as possible

---

**Q: What is batching in React 18?**

A: React 18 automatically batches multiple state updates into a single re-render, even inside async functions, timeouts, and event handlers.

```jsx
// React 18 — only ONE re-render for both setState calls
setTimeout(() => {
  setUser(u);
  setRole(r); // batched with above
}, 0);
```

Before React 18, batching only happened inside React event handlers.

---

### Common Tricky Questions

**Q: Why can't you use `async` directly in `useEffect`?**

A: `useEffect` must return either nothing or a cleanup function. An `async` function returns a Promise — React doesn't know what to do with it.

```jsx
// WRONG
useEffect(async () => {
  const data = await fetchData();
}, []);

// CORRECT
useEffect(() => {
  async function load() {
    const data = await fetchData();
  }
  load();
}, []);
```

---

**Q: What happens when you call `setState` multiple times in the same event handler?**

A: React batches them into one re-render. The final state is computed from all updates.

```jsx
// Only ONE re-render, count ends up as 1 (not 3)
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);

// To get 3 use function form:
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1); // count = 3
```

---

**Q: What is `key` in React and why is it important in lists?**

A: `key` helps React identify which items changed, added, or removed in a list. Without a stable key, React may re-render wrong items or cause UI bugs.

```jsx
// WRONG — index as key causes bugs when list order changes
policies.map((p, i) => <Card key={i} policy={p} />)

// CORRECT — stable unique ID
policies.map((p) => <Card key={p.id} policy={p} />)
```

We use `key={p.id}` in our policy lists — correct.

---

**Q: What is the difference between `null`, `undefined`, and `false` in JSX?**

A: All three render nothing — they are valid but invisible. Useful for conditional rendering.

```jsx
{isAdmin && <AdminPanel />}  // false → renders nothing
{user ?? <Login />}          // null/undefined → renders Login
```

Careful: `0` renders as `"0"` in JSX — a common bug:
```jsx
{count && <List />}  // if count = 0, renders "0" not nothing!
{count > 0 && <List />}  // correct
```

---

## PART 5 — Quick Reference Cheat Sheet

| Hook | Purpose | Re-renders? |
|---|---|---|
| `useState` | Local component state | Yes |
| `useEffect` | Side effects, subscriptions | No |
| `useContext` | Read from context | Yes (on context change) |
| `useRef` | DOM access, persist value | No |
| `useCallback` | Memoize function | No |
| `useMemo` | Memoize value | No |
| `useReducer` | Complex state logic | Yes |
| `useLayoutEffect` | DOM measurements pre-paint | No |

| Pattern | When to use |
|---|---|
| Context | Global state (auth, theme) |
| Custom hook | Reusable stateful logic |
| React.memo | Prevent child re-render |
| Lazy + Suspense | Code splitting by route |
| Controlled input | Form validation needed |
| useCallback | Function passed to memo child |
