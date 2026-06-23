import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { onAuthStateChanged, getDoc } from './firebase.mock';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { mockUser } from './firebase.mock';

function TestConsumer() {
  const { user, role, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return <div>{user ? `${user.email}:${role}` : 'no user'}</div>;
}

beforeEach(() => {
  getDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'USER' }) });
});

describe('AuthContext', () => {
  it('shows loading initially', () => {
    onAuthStateChanged.mockImplementation(() => () => {});
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    // loading=true so children not rendered yet (AuthProvider hides children while loading)
    expect(screen.queryByText('no user')).not.toBeInTheDocument();
  });

  it('provides user and role after auth state resolves', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(mockUser);
      return () => {};
    });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByText('test@test.com:USER')).toBeInTheDocument();
    });
  });

  it('provides null user when signed out', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(null);
      return () => {};
    });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByText('no user')).toBeInTheDocument();
    });
  });
});
