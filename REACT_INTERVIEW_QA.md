# React Interview Q&A — Complete Preparation Guide

---

## SECTION 1 — React Basics

---

**Q1. What is React and why use it?**

React is a JavaScript library for building user interfaces. It uses a component-based architecture where UI is broken into reusable pieces, and a virtual DOM to update only what changed — making it fast and predictable.

Why use it:
- Reusable components
- Unidirectional data flow (easy to debug)
- Huge ecosystem
- Virtual DOM = efficient updates

---

**Q2. What is the virtual DOM? How does it work?**

The virtual DOM is a lightweight JavaScript copy of the real DOM kept in memory.

How it works:
1. State changes → React creates a new virtual DOM tree
2. React **diffs** new tree vs old tree (reconciliation)
3. React calculates the **minimum** set of real DOM changes
4. React applies only those changes (commit phase)

Why it matters: Direct DOM manipulation is slow. React batches and minimizes it.

---

**Q3. What is JSX?**

JSX is a syntax extension that looks like HTML but compiles to `React.createElement()` calls.

```jsx
// JSX
const el = <h1 className="title">Hello</h1>

// What it compiles to
const el = React.createElement('h1', { className: 'title' }, 'Hello')
```

Rules:
- Use `className` not `class`
- All tags must be closed (`<br />`)
- Must return one root element (or use `<>` Fragment)
- JavaScript expressions go inside `{}`

---

**Q4. What is the difference between a class component and a functional component?**

| | Class Component | Functional Component |
|---|---|---|
| Syntax | `class Foo extends React.Component` | `function Foo()` |
| State | `this.state` + `this.setState` | `useState` hook |
| Lifecycle | `componentDidMount`, etc. | `useEffect` |
| `this` keyword | Required | Not needed |
| Current standard | Legacy | ✅ Modern |

Functional components with hooks are the current standard. Know class components exist but write functional.

---

**Q5. What is the difference between props and state?**

| | Props | State |
|---|---|---|
| Owned by | Parent | The component itself |
| Mutable? | ❌ Read-only | ✅ Yes, via setState |
| Triggers re-render? | ✅ Yes | ✅ Yes |

Props flow down (parent → child). State is local. When you need to share state between siblings, lift it to their common parent.

---

**Q6. What is the key prop and why is it important?**

`key` is a special prop React uses to identify list items during reconciliation.

```jsx
// ❌ Wrong — index causes bugs on reorder/delete
items.map((item, i) => <Card key={i} />)

// ✅ Correct — stable unique ID
items.map(item => <Card key={item.id} />)
```

Without a stable key, React may re-render wrong items, lose input focus, or show wrong data after list reordering.

---

**Q7. What is a controlled vs uncontrolled component?**

**Controlled** — React state is the single source of truth for the input value.
```jsx
const [name, setName] = useState('')
<input value={name} onChange={e => setName(e.target.value)} />
```

**Uncontrolled** — DOM manages the value; you read it with a ref.
```jsx
const ref = useRef()
<input ref={ref} />
// read: ref.current.value
```

Use controlled for form validation. Use uncontrolled for file inputs or integrating with non-React libraries.

---

**Q8. What is lifting state up?**

When two sibling components need to share state, you move the state to their closest common ancestor and pass it down via props.

```jsx
// Parent owns the state
function Parent() {
  const [value, setValue] = useState('')
  return (
    <>
      <InputA value={value} onChange={setValue} />
      <DisplayB value={value} />
    </>
  )
}
```

---

**Q9. What are fragments?**

Fragments let you return multiple elements without adding an extra DOM node.

```jsx
// Without fragment — adds unnecessary div
return <div><h1 /><p /></div>

// With fragment — no extra DOM node
return <><h1 /><p /></>

// Long form (allows key prop)
return <React.Fragment key={id}><h1 /><p /></React.Fragment>
```

---

**Q10. What is reconciliation?**

Reconciliation is React's algorithm for updating the DOM efficiently.

Rules:
1. If element **type changes** (div → span) — unmount old, mount new
2. If element **type same** — update changed props only
3. **Lists** — use `key` to match old vs new items

React assumes same type = same component and reuses it. Different type = destroy and rebuild.

---

## SECTION 2 — Hooks

---

**Q11. What are React hooks? Why were they introduced?**

Hooks are functions that let you use React features (state, lifecycle, context) in functional components.

Introduced in React 16.8 to:
- Avoid class component complexity (`this`, binding)
- Reuse stateful logic without HOCs or render props
- Organize code by concern, not lifecycle method

---

**Q12. Explain useState.**

```jsx
const [state, setState] = useState(initialValue)
```

- `state` — current value
- `setState` — function to update it (triggers re-render)
- `initialValue` — can be a value or a lazy init function `useState(() => expensiveCalc())`

Key behaviors:
- Updates are **batched** in React 18
- Never mutate state directly — always create a new reference
- For objects/arrays use spread: `setState({ ...state, name: 'new' })`

---

**Q13. Explain useEffect. What are its use cases?**

```jsx
useEffect(() => {
  // side effect
  return () => { /* cleanup */ }
}, [dependencies])
```

Use cases:
- Fetching data
- Setting up subscriptions / event listeners
- DOM manipulation
- Timers

Dependency array behavior:
- `[]` — runs once on mount
- `[val]` — runs when val changes
- no array — runs after every render

**Always return a cleanup function** when setting up subscriptions to prevent memory leaks.

---

**Q14. Why can't you use async directly in useEffect?**

`useEffect` expects the callback to return either nothing or a cleanup function. An async function always returns a Promise — React doesn't know what to do with it.

```jsx
// ❌ Wrong
useEffect(async () => {
  const data = await fetch('/api')
}, [])

// ✅ Correct
useEffect(() => {
  async function load() {
    const data = await fetch('/api')
    setData(data)
  }
  load()
}, [])
```

---

**Q15. What is a stale closure in useEffect?**

When a function inside `useEffect` captures a variable's value at the time the effect ran and never sees updates because the dependency array is wrong.

```jsx
// Bug: count is always 0 inside interval
const [count, setCount] = useState(0)
useEffect(() => {
  const id = setInterval(() => {
    console.log(count) // always 0!
  }, 1000)
  return () => clearInterval(id)
}, []) // ← count missing from deps

// Fix 1: add count to deps
}, [count])

// Fix 2: use functional update (doesn't need count in deps)
setInterval(() => setCount(c => c + 1), 1000)
```

---

**Q16. Explain useRef. When would you use it over useState?**

`useRef` returns a mutable object `{ current: value }` that persists across renders without triggering a re-render when changed.

Use `useRef` when you need to:
- Access a DOM element
- Store a previous value
- Store a timer/interval ID
- Hold a value that changes but shouldn't cause re-render

```jsx
// DOM access
const inputRef = useRef()
<input ref={inputRef} />
inputRef.current.focus()

// Store previous value
const prevCount = useRef()
useEffect(() => { prevCount.current = count }, [count])

// Timer
const timerRef = useRef()
timerRef.current = setTimeout(...)
clearTimeout(timerRef.current)
```

---

**Q17. What is useCallback and when should you use it?**

`useCallback` memoizes a function so it keeps the same reference between renders.

```jsx
const handleClick = useCallback(() => {
  doThing(id)
}, [id]) // recreates only when id changes
```

**When to use:** Only when passing the function as a prop to a `React.memo` component. Otherwise the memo'd child gets a new function reference every render and re-renders anyway.

Without `React.memo` on the child, `useCallback` has no benefit.

---

**Q18. What is useMemo?**

`useMemo` memoizes a computed value so it's not recalculated on every render.

```jsx
const filtered = useMemo(() =>
  policies.filter(p => p.status === 'active'),
[policies]) // only recalculates when policies changes
```

**When to use:** Expensive calculations (sorting/filtering large arrays, complex transforms). Don't use it for everything — it has overhead and adds complexity.

---

**Q19. What is useReducer? When over useState?**

`useReducer` manages state through a reducer function `(state, action) => newState`.

```jsx
const [state, dispatch] = useReducer(reducer, initialState)
dispatch({ type: 'LOGIN', payload: user })

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': return { ...state, user: action.payload, isAuth: true }
    case 'LOGOUT': return { ...state, user: null, isAuth: false }
    default: return state
  }
}
```

Use `useReducer` over `useState` when:
- Multiple related state values update together
- Next state depends on previous state in complex ways
- State logic is complex enough to test separately

---

**Q20. What is useContext? What are its performance implications?**

`useContext` subscribes a component to a context value.

```jsx
const { user, login } = useContext(AuthContext)
```

**Performance:** Every time the context value changes, **all** components using `useContext` re-render — even if only one property they use changed.

Fix: memoize the context value or split into multiple contexts.
```jsx
const value = useMemo(() => ({ user, role, login, logout }), [user, role])
```

---

## SECTION 3 — Component Patterns

---

**Q21. What is React.memo?**

A higher-order component that wraps a component and skips re-rendering it if props haven't changed (shallow comparison).

```jsx
const Button = React.memo(({ onClick, label }) => (
  <button onClick={onClick}>{label}</button>
))
```

Without `memo`: parent re-renders → child always re-renders
With `memo`: parent re-renders → child only re-renders if props changed

Pair with `useCallback` for function props.

---

**Q22. What is prop drilling and how do you solve it?**

Prop drilling = passing props through multiple intermediate components that don't use them, just to reach a deeply nested component.

```
App (has user) → Layout → Sidebar → UserMenu (needs user)
                      ↑ doesn't use user but must pass it
```

Solutions:
1. **React Context** — best for truly global data (auth, theme)
2. **Component composition** — pass components as children
3. **State management** — Zustand, Redux for complex apps

---

**Q23. What is a Higher Order Component (HOC)?**

A function that takes a component and returns a new component with added behavior.

```jsx
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    if (!isLoggedIn) return <Navigate to="/login" />
    return <Component {...props} />
  }
}
const ProtectedPage = withAuth(Dashboard)
```

HOCs are largely replaced by custom hooks in modern React — hooks are simpler and more composable.

---

**Q24. What is a custom hook?**

A function starting with `use` that calls other hooks. Lets you extract and reuse stateful logic.

```jsx
function usePolicies() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPolicies().then(setPolicies).finally(() => setLoading(false))
  }, [])

  return { policies, loading }
}

// Reuse in any component
const { policies, loading } = usePolicies()
```

Rules: must start with `use`, can call other hooks, can't be called conditionally.

---

**Q25. What is lazy loading?**

Loading components only when they're needed instead of bundling everything upfront.

```jsx
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  )
}
```

Reduces initial bundle size. Only users who visit `/admin` download `AdminDashboard.js`.

---

## SECTION 4 — Performance

---

**Q26. How do you optimize React performance?**

In order of impact:

1. **Fix unnecessary re-renders** — `React.memo` + `useCallback` + `useMemo`
2. **Code splitting** — `React.lazy` per route
3. **Virtualize long lists** — `react-window` or `react-virtual`
4. **Avoid anonymous functions/objects in JSX** — creates new reference every render
5. **Move state down** — keep state as close to where it's used as possible
6. **Split context** — one large context re-renders everything; split by concern

```jsx
// ❌ New object every render → child always re-renders
<Child style={{ color: 'red' }} onClick={() => doThing()} />

// ✅ Stable references
const style = useMemo(() => ({ color: 'red' }), [])
const handleClick = useCallback(() => doThing(), [])
<Child style={style} onClick={handleClick} />
```

---

**Q27. What is React 18 automatic batching?**

In React 17, state updates were only batched inside React event handlers. In React 18, all updates are batched — including inside `setTimeout`, Promises, and async functions.

```jsx
// React 17: 2 re-renders
setTimeout(() => {
  setCount(1)  // re-render
  setFlag(true) // re-render
}, 0)

// React 18: 1 re-render (automatic batching)
setTimeout(() => {
  setCount(1)
  setFlag(true) // batched → single re-render
}, 0)
```

---

**Q28. What is useTransition?**

A React 18 hook that marks a state update as non-urgent, keeping the UI responsive.

```jsx
const [isPending, startTransition] = useTransition()

function handleSearch(input) {
  setInputValue(input)            // urgent — update input immediately
  startTransition(() => {
    setSearchResults(filter(input)) // non-urgent — can be interrupted
  })
}
```

Use when: filtering large lists, tab switching, any update that might cause slow rendering.

---

## SECTION 5 — React Router v6

---

**Q29. How does React Router v6 work?**

```jsx
// Wrap app in BrowserRouter
// Define routes with Routes + Route
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
</BrowserRouter>
```

Key v6 changes from v5:
- `Switch` → `Routes`
- `component={}` → `element={<Component />}`
- No exact prop needed (exact by default)
- Nested routes use `<Outlet />`

---

**Q30. What is the Outlet component?**

`Outlet` renders the matched child route inside a parent route component. Used for layouts and protected routes.

```jsx
// Parent route — wraps children
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile" element={<Profile />} />
</Route>

// ProtectedRoute renders Outlet where children go
function ProtectedRoute() {
  if (!user) return <Navigate to="/login" replace />
  return <Outlet /> // Dashboard or Profile renders here
}
```

---

**Q31. What is the difference between useNavigate and Navigate?**

- `useNavigate()` — hook, navigate programmatically from functions/handlers
- `<Navigate />` — component, navigate declaratively during render

```jsx
// useNavigate — in event handlers, after async operations
const navigate = useNavigate()
async function handleLogin() {
  await login()
  navigate('/dashboard')
}

// Navigate — in JSX, for redirects based on state
if (!user) return <Navigate to="/login" replace />
```

---

## SECTION 6 — Common Tricky Questions

---

**Q32. What happens when you call setState multiple times in a row?**

React batches them into a single re-render. All updates use the same initial state value unless you use the functional form.

```jsx
// count = 0. After this, count = 1 (not 3)
setCount(count + 1)
setCount(count + 1)
setCount(count + 1)

// count = 0. After this, count = 3
setCount(c => c + 1)
setCount(c => c + 1)
setCount(c => c + 1)
```

Always use the functional form when new state depends on old state.

---

**Q33. Why does `{0 && <Component />}` render "0" instead of nothing?**

Because `0` is falsy but it IS a valid React node (it renders as the string "0"). `false`, `null`, `undefined` render nothing — but `0` doesn't.

```jsx
// ❌ Renders "0" when items is empty
{items.length && <List />}

// ✅ Renders nothing when items is empty
{items.length > 0 && <List />}
{!!items.length && <List />}
{items.length ? <List /> : null}
```

---

**Q34. What is the difference between useEffect and useLayoutEffect?**

| | useEffect | useLayoutEffect |
|---|---|---|
| When it runs | After browser paints | Before browser paints (synchronous) |
| Blocking? | ❌ Non-blocking | ✅ Blocks paint |
| Use for | Data fetch, subscriptions | DOM measurements, avoid flicker |

```jsx
// useLayoutEffect — measure DOM before user sees it
useLayoutEffect(() => {
  const height = ref.current.getBoundingClientRect().height
  setHeight(height) // update before paint — no flicker
}, [])
```

Use `useLayoutEffect` only when you see visual flicker with `useEffect`.

---

**Q35. What causes infinite loops in useEffect?**

1. **Missing stable dependency** — object/array created inline is new every render
```jsx
// ❌ Infinite loop — new object every render
useEffect(() => { fetch(options) }, [{ url: '/api' }])

// ✅ Define outside or useMemo
const options = useMemo(() => ({ url: '/api' }), [])
useEffect(() => { fetch(options) }, [options])
```

2. **setState in effect without condition**
```jsx
// ❌ Infinite loop
useEffect(() => { setCount(count + 1) }, [count])

// ✅ No dependency on count
useEffect(() => { setCount(c => c + 1) }, [])
```

---

**Q36. Can you call hooks conditionally?**

No. Hooks must be called in the same order every render. Conditionals break the order.

```jsx
// ❌ Breaks rules of hooks
if (isLoggedIn) {
  const [data, setData] = useState(null) // sometimes 1st hook, sometimes not
}

// ✅ Call unconditionally, use condition inside
const [data, setData] = useState(null)
useEffect(() => {
  if (isLoggedIn) fetchData()
}, [isLoggedIn])
```

---

**Q37. What is the difference between controlled forms and why validation is easier?**

With controlled forms, React state is always in sync with the input. You can validate on every keystroke, on blur, or on submit.

```jsx
const [email, setEmail] = useState('')
const [error, setError] = useState('')

function handleChange(e) {
  setEmail(e.target.value)
  setError(e.target.value.includes('@') ? '' : 'Invalid email')
}
```

With uncontrolled forms, you can only validate on submit when you read the ref value.

---

## SECTION 7 — Quick Fire Round

**Q: What is React.StrictMode?**
A: Development-only wrapper that double-invokes renders and effects to detect side effects. Has no effect in production.

**Q: What is a synthetic event?**
A: React's wrapper around native browser events. Normalizes behavior across browsers. In React 17+, events are attached to the root instead of document.

**Q: What is the difference between imperative and declarative?**
A: Imperative = how to do it (`document.createElement`, manual DOM). Declarative = what the UI should look like (`return <div>{name}</div>`). React is declarative.

**Q: What does `React.Children` do?**
A: Utilities to iterate/manipulate `props.children` — `React.Children.map`, `.count`, `.forEach`.

**Q: What is a portal?**
A: Renders children outside the parent DOM hierarchy. Used for modals, tooltips.
```jsx
ReactDOM.createPortal(<Modal />, document.getElementById('modal-root'))
```

**Q: What is an error boundary?**
A: A class component that catches JavaScript errors in its child tree and shows a fallback UI instead of crashing.
```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) { logError(error) }
  render() {
    if (this.state.hasError) return <h1>Something went wrong</h1>
    return this.props.children
  }
}
```

**Q: What is hydration?**
A: The process of attaching React event handlers to server-rendered HTML. SSR sends HTML to the browser, React "hydrates" it to make it interactive.

**Q: What is `flushSync`?**
A: Forces React to flush all pending state updates synchronously before returning.
```jsx
flushSync(() => setCount(1)) // DOM updated immediately
console.log(ref.current.textContent) // sees updated value
```
