import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePolicies } from '../hooks/usePolicies';
import { getAllUsers } from '../services/firestore.service';

const STATUS_BADGE = {
  active: 'success',
  draft: 'warning',
  archived: 'secondary',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { policies, loading: policiesLoading } = usePolicies();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .finally(() => setUsersLoading(false));
  }, []);

  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.status === 'active').length,
    draft: policies.filter((p) => p.status === 'draft').length,
    archived: policies.filter((p) => p.status === 'archived').length,
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold">
          <i className="bi bi-shield-lock me-2" />
          PolicyHub <span className="badge bg-warning text-dark ms-2 small">Admin</span>
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white small">{user?.displayName || user?.email}</span>
          <button className="btn btn-outline-light btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="container py-4">
        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Total Policies', value: stats.total, icon: 'bi-file-text', color: 'primary' },
            { label: 'Active', value: stats.active, icon: 'bi-check-circle', color: 'success' },
            { label: 'Draft', value: stats.draft, icon: 'bi-pencil', color: 'warning' },
            { label: 'Total Users', value: usersLoading ? '…' : users.length, icon: 'bi-people', color: 'info' },
          ].map((s) => (
            <div key={s.label} className="col-6 col-md-3">
              <div className="card shadow-sm text-center">
                <div className="card-body py-3">
                  <i className={`bi ${s.icon} fs-3 text-${s.color}`} />
                  <h4 className="fw-bold mt-1 mb-0">{s.value}</h4>
                  <div className="text-muted small">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          {/* All Policies */}
          <div className="col-lg-7">
            <div className="card shadow-sm">
              <div className="card-header fw-semibold bg-white">All Policies</div>
              <div className="card-body p-0">
                {policiesLoading ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></div>
                ) : policies.length === 0 ? (
                  <p className="text-muted text-center py-4 mb-0">No policies yet.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {policies.map((p) => (
                      <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{p.title}</div>
                          <small className="text-muted">{p.category}</small>
                        </div>
                        <span className={`badge bg-${STATUS_BADGE[p.status] ?? 'secondary'}`}>
                          {p.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="col-lg-5">
            <div className="card shadow-sm">
              <div className="card-header fw-semibold bg-white">Users</div>
              <div className="card-body p-0">
                {usersLoading ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {users.map((u) => (
                      <li key={u.uid} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{u.name || '—'}</div>
                          <small className="text-muted">{u.email}</small>
                        </div>
                        <span className={`badge ${u.role === 'ADMIN' ? 'bg-dark' : 'bg-primary'}`}>
                          {u.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
