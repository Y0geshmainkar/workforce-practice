import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, role, login, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Navigate only after AuthContext has resolved user + role
  useEffect(() => {
    if (user && role) {
      navigate(role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, role, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      // navigation handled by useEffect above
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
      // navigation handled by useEffect above
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h4 className="card-title fw-bold mb-1">Welcome back</h4>
          <p className="text-muted small mb-4">Sign in to PolicyHub</p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : 'Sign In'}
            </button>
          </form>

          <div className="d-flex align-items-center my-3">
            <hr className="flex-grow-1" />
            <span className="px-2 text-muted small">or</span>
            <hr className="flex-grow-1" />
          </div>

          <div className="d-grid gap-2">
            <button
              className="btn btn-outline-danger"
              onClick={() => handleOAuth(loginWithGoogle)}
              disabled={loading}
            >
              <i className="bi bi-google me-2" />
              Continue with Google
            </button>
            <button
              className="btn btn-outline-dark"
              onClick={() => handleOAuth(loginWithGithub)}
              disabled={loading}
            >
              <i className="bi bi-github me-2" />
              Continue with GitHub
            </button>
          </div>

          <p className="text-center text-muted small mt-4 mb-0">
            No account?{' '}
            <Link to="/register" className="text-decoration-none">
              Create one
            </Link>
          </p>
        </div>
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
