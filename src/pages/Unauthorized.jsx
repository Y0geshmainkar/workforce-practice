import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-slate-600">
      <span className="text-6xl mb-4">🚫</span>
      <h2 className="text-2xl font-bold mb-2">403 — Access Denied</h2>
      <p className="text-slate-500 mb-6">You don&apos;t have permission to view this page.</p>
      <Link to="/login" className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 text-sm">
        Back to Login
      </Link>
    </div>
  );
}
