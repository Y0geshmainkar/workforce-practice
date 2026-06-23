import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock useAuth to control auth state in each test
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from '../context/AuthContext';

function setup(authValue) {
  useAuth.mockReturnValue(authValue);
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute requiredRole={authValue.requiredRole} />}>
          <Route path="/protected" element={<div>protected content</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/unauthorized" element={<div>unauthorized page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows spinner while loading', () => {
    setup({ user: null, role: null, loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    setup({ user: null, role: null, loading: false });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders children when authenticated and no role required', () => {
    setup({ user: { uid: '1' }, role: 'USER', loading: false });
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('redirects to /unauthorized when role does not match', () => {
    setup({ user: { uid: '1' }, role: 'USER', loading: false, requiredRole: 'ADMIN' });
    expect(screen.getByText('unauthorized page')).toBeInTheDocument();
  });

  it('renders children when role matches', () => {
    setup({ user: { uid: '1' }, role: 'ADMIN', loading: false, requiredRole: 'ADMIN' });
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
