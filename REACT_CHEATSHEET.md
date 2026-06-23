# React Interview Cheat Sheet

---

## 1. Core Concepts

| Concept | One Line |
|---|---|
| Virtual DOM | JS copy of real DOM; React diffs it to find minimal updates |
| Reconciliation | Process of diffing old vs new virtual DOM |
| Fiber | React's internal reconciliation engine (React 16+) |
| Controlled component | Form value driven by React state |
| Uncontrolled component | Form value lives in DOM, read via `ref` |
| Lifting state up | Move shared state to nearest common ancestor |
| Composition | Build complex UI by combining simple components |
| Key | Unique ID for list items; helps React track changes |

---

## 2. Hooks Quick Reference

| Hook | Purpose | Triggers Re-render |
|---|---|---|
| `useState` | Local state | ✅ Yes |
| `useEffect` | Side effects, subscriptions, data fetch | ❌ No |
| `useContext` | Read context value | ✅ Yes (on context change) |
| `useRef` | DOM access / persist value without re-render | ❌ No |
| `useCallback` | Memoize a function reference | ❌ No |
| `useMemo` | Memoize a computed value | ❌ No |
| `useReducer` | Complex state with actions | ✅ Yes |
| `useLayoutEffect` | Like useEffect but fires before browser paint | ❌ No |
| `useId` | Generate stable unique IDs | ❌ No |

---

## 3. Rules of Hooks

1. Only call hooks at the **top level** (not inside if, loops, nested functions)
2. Only call hooks from **React function components** or custom hooks

Why: React tracks hooks by call order. Conditionals break that order.

---

## 4. useEffect Patterns

```jsx
useEffect(() => { ... })           // every render
useEffect(() => { ... }, [])       // once on mount
useEffect(() => { ... }, [val])    // when val changes
useEffect(() => { return cleanup }, []) // with cleanup (unsubscribe, clearInterval)
```

**❌ Can't use async directly:**
```jsx
// WRONG
useEffect(async () => { await fetch(...) }, [])

// CORRECT
useEffect(() => {
  async function load() { await fetch(...) }
  load()
}, [])
```

---

## 5. useState Gotchas

```jsx
// State updates are BATCHED — only 1 re-render
setA(1)
setB(2)  // → one render with both updates

// Stale state — wrong
setCount(count + 1)
setCount(count + 1) // both use same count → result: +1 not +2

// Correct — use functional update
setCount(c => c + 1)
setCount(c => c + 1) // result: +2

// Never mutate directly
state.name = 'x'     // ❌ no re-render
setState({...state, name: 'x'}) // ✅
```

---

## 6. Stale Closure

```jsx
// Bug: effect captures count=0 and never updates
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000)
  return () => clearInterval(id)
}, []) // ← missing count

// Fix: add to deps OR use ref
useEffect(() => { ... }, [count])
```

---

## 7. Performance Optimization

| Tool | Use when |
|---|---|
| `React.memo` | Child re-renders when parent does but props didn't change |
| `useCallback` | Function is passed as prop to a memo'd child |
| `useMemo` | Expensive calculation runs on every render |
| `React.lazy` + `Suspense` | Split bundle by route/component |
| `useTransition` | Mark updates as non-urgent (React 18) |
| Virtualization | Long lists (react-window / react-virtual) |

```jsx
// React.memo — skip re-render if props same
const Child = React.memo(({ onClick }) => <button onClick={onClick} />)

// useCallback — stable function reference
const handleClick = useCallback(() => doThing(id), [id])

// useMemo — expensive value
const sorted = useMemo(() => items.sort(...), [items])
```

---

## 8. Context

```jsx
// Create
const AuthContext = createContext(null)

// Provide
<AuthContext.Provider value={{ user, login, logout }}>
  {children}
</AuthContext.Provider>

// Consume
const { user } = useContext(AuthContext)

// ⚠️ Every context value change re-renders ALL consumers
// Fix: memoize the value
const value = useMemo(() => ({ user, login }), [user])
```

---

## 9. useRef vs useState

```jsx
const [count, setCount] = useState(0)  // re-renders on change
const countRef = useRef(0)             // NO re-render on change

// Use ref for:
// - Accessing DOM nodes
// - Storing previous value
// - Storing timers/intervals
// - Persisting values across renders without causing re-render
```

---

## 10. Common JSX Traps

```jsx
// 0 renders as "0" — common bug
{items.length && <List />}     // ❌ renders "0" when empty
{items.length > 0 && <List />} // ✅

// null, undefined, false render nothing
{isAdmin && <Panel />}   // false → nothing rendered
{user ?? <Login />}      // null/undefined → render Login

// Keys must be stable and unique
{items.map((item, i) => <Card key={i} />)}     // ❌ index as key
{items.map(item => <Card key={item.id} />)}    // ✅
```

---

## 11. Event Handling

```jsx
// Synthetic events — React wraps native events
<button onClick={(e) => e.preventDefault()}>

// Pass args — use arrow function wrapper
<button onClick={() => handleDelete(id)}>

// ❌ Don't call the function directly — fires on render
<button onClick={handleDelete(id)}>
```

---

## 12. React 18 Features

| Feature | What it does |
|---|---|
| Automatic batching | Batches state updates everywhere (async, timeouts too) |
| `useTransition` | Mark state update as non-urgent, keep UI responsive |
| `useDeferredValue` | Defer re-rendering expensive part of UI |
| `Suspense` for data | Wait for async data before rendering |
| `createRoot` | New root API (replaces `ReactDOM.render`) |

```jsx
// useTransition — keep input responsive while filtering large list
const [isPending, startTransition] = useTransition()
startTransition(() => setFilter(value)) // non-urgent update
```

---

## 13. Component Patterns

```jsx
// Compound components
<Select>
  <Select.Option value="a">A</Select.Option>
</Select>

// Render props
<DataProvider render={(data) => <Table data={data} />} />

// HOC (Higher Order Component)
const WithAuth = (Component) => (props) =>
  isLoggedIn ? <Component {...props} /> : <Login />

// Custom hook (preferred over HOC/render props)
function useWindowSize() {
  const [size, setSize] = useState(window.innerWidth)
  useEffect(() => { ... }, [])
  return size
}
```

---

## 14. React Router v6

```jsx
// Protected route pattern
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>

// ProtectedRoute uses Outlet
if (!user) return <Navigate to="/login" replace />
return <Outlet />

// replace vs push
<Navigate to="/login" replace />  // replaces history entry (no back button trap)
<Navigate to="/login" />          // pushes new entry
```

---

## 15. Top Tricky Interview Questions

| Question | Key Point |
|---|---|
| Why not mutate state? | Same reference → React skips re-render |
| async in useEffect? | Returns Promise not cleanup → use inner async fn |
| setState multiple times? | Batched → use functional update `c => c + 1` for sequential |
| Missing dep in useEffect? | Stale closure — old value used forever |
| index as key? | Breaks on reorder/insert — use stable ID |
| 0 && component? | 0 renders as "0" — use `> 0 &&` |
| useCallback always? | Only useful with React.memo child — overuse wastes memory |
| useContext performance? | All consumers re-render on any value change — split or memoize |
| useEffect vs useLayoutEffect? | useLayoutEffect blocks paint — only for DOM measurements |
| Why rules of hooks? | React tracks hooks by order — conditionals break order |
