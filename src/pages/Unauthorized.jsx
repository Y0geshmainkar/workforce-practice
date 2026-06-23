export default function Unauthorized() {
  return (
    <div className="container mt-5 text-center">
      <i className="bi bi-shield-x display-1 text-danger"></i>
      <h2 className="mt-3">403 — Access Denied</h2>
      <p className="text-muted">You don&apos;t have permission to view this page.</p>
      <a href="/login" className="btn btn-primary">Back to Login</a>
    </div>
  );
}
