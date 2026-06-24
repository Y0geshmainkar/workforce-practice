import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../hooks/useReminders';

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
        active ? 'bg-blue-100 text-blue-900' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}

export default function AppLayout({ children }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useReminders(user?.uid, role);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isAdmin = role === 'ADMIN';

  const nav = (
    <nav className="flex flex-col gap-1 p-4">
      {isAdmin ? (
        <>
          <NavLink to="/dashboard">📊 Dashboard</NavLink>
          <NavLink to="/policies">📋 All Policies</NavLink>
          <NavLink to="/clients">👥 Clients</NavLink>
          <NavLink to="/reminders">
            🔔 Reminders{unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {unreadCount}
              </span>
            )}
          </NavLink>
        </>
      ) : (
        <>
          <NavLink to="/dashboard">📋 My Policies</NavLink>
          <NavLink to="/reminders">🔔 Reminders</NavLink>
        </>
      )}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 text-left mt-4"
      >
        🚪 Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 shrink-0">
        <div className="px-4 py-4 border-b border-slate-200">
          <span className="text-xl font-bold text-blue-900">PolicyHub</span>
        </div>
        {nav}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-60 bg-white border-r border-slate-200 z-50">
            <div className="px-4 py-4 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">PolicyHub</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 text-xl">✕</button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            className="md:hidden text-slate-500 text-xl"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <span className="text-lg font-bold text-blue-900 md:hidden">PolicyHub</span>
          <span className="ml-auto text-sm text-slate-500">{user?.email}</span>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
