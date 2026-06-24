import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, role, login, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role) navigate('/dashboard', { replace: true });
  }, [user, role, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(fn) {
    setError('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">PolicyHub</h1>
        <p className="text-slate-500 text-sm mb-6">Track every policy. Miss no renewal.</p>

        {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            className="w-full bg-blue-900 text-white py-2 rounded text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4">
          <hr className="flex-1 border-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <hr className="flex-1 border-slate-200" />
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleOAuth(loginWithGoogle)}
            disabled={loading}
            className="w-full border border-slate-300 text-slate-700 py-2 rounded text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            🔴 Continue with Google
          </button>
          <button
            onClick={() => handleOAuth(loginWithGithub)}
            disabled={loading}
            className="w-full border border-slate-300 text-slate-700 py-2 rounded text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            ⚫ Continue with GitHub
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          No account?{' '}
          <Link to="/register" className="text-blue-900 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}
