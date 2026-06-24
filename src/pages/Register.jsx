import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      const cred = await register(form.name, form.email, form.password);
      const uid = cred?.user?.uid ?? cred?.uid;
      if (uid) {
        await setDoc(doc(db, 'users', uid), { role }, { merge: true });
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  const roleCard = (value, label, desc) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={`flex-1 border-2 rounded-lg p-3 text-left transition-colors ${
        role === value ? 'border-blue-900 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="font-medium text-sm text-slate-800">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">PolicyHub</h1>
        <p className="text-slate-500 text-sm mb-6">Create your account</p>

        {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
            <p className="text-xs text-slate-400 mt-1">Minimum 8 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">I am…</label>
            <div className="flex gap-3">
              {roleCard('ADMIN', '🧑‍💼 I am an Agent', 'Manage policies & clients')}
              {roleCard('USER', '👤 I am a Client', 'View my policies')}
            </div>
          </div>
          <button
            className="w-full bg-blue-900 text-white py-2 rounded text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-900 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 8 characters.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}
