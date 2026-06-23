import { useAuth } from '../context/AuthContext';
import { usePolicies } from '../hooks/usePolicies';

const STATUS_BADGE = {
  active: 'success',
  draft: 'warning',
  archived: 'secondary',
};

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const { policies, loading, error } = usePolicies();

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">
          <i className="bi bi-shield-check me-2" />
          PolicyHub
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white small">{user?.displayName || user?.email}</span>
          <button className="btn btn-outline-light btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="container py-4">
        <h5 className="fw-bold mb-4">My Assigned Policies</h5>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && policies.length === 0 && (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox display-4 d-block mb-2" />
            No policies assigned to you yet.
          </div>
        )}

        {!loading && policies.length > 0 && (
          <div className="row g-3">
            {policies.map((p) => (
              <div key={p.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="card-title mb-0 fw-semibold">{p.title}</h6>
                      <span className={`badge bg-${STATUS_BADGE[p.status] ?? 'secondary'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="card-text text-muted small">{p.description}</p>
                    <span className="badge bg-light text-dark border">{p.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
