import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  getDoc,
  setDoc,
} from './firebase.mock';
import { login, register, logout } from '../services/auth.service';

beforeEach(() => {
  signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
  createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
  signInWithPopup.mockResolvedValue({ user: mockUser });
  signOut.mockResolvedValue();
  updateProfile.mockResolvedValue();
  getDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'USER' }) });
  setDoc.mockResolvedValue();
});

describe('auth.service', () => {
  it('login calls signInWithEmailAndPassword and returns user', async () => {
    const user = await login('test@test.com', 'password123');
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'test@test.com', 'password123');
    expect(user).toEqual(mockUser);
  });

  it('register creates user, updates profile, creates firestore doc', async () => {
    await register('Test User', 'test@test.com', 'password123');
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({}, 'test@test.com', 'password123');
    expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
  });

  it('logout calls signOut', async () => {
    await logout();
    expect(signOut).toHaveBeenCalled();
  });
});
