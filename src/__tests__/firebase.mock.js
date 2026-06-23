import { vi } from 'vitest';

// Mock firebase/auth
export const mockUser = { uid: 'uid123', email: 'test@test.com', displayName: 'Test User' };

export const signInWithEmailAndPassword = vi.fn();
export const createUserWithEmailAndPassword = vi.fn();
export const signInWithPopup = vi.fn();
export const signOut = vi.fn();
export const updateProfile = vi.fn();
export const onAuthStateChanged = vi.fn();
export const GoogleAuthProvider = vi.fn();
export const GithubAuthProvider = vi.fn();
export const getAuth = vi.fn(() => ({}));

vi.mock('firebase/auth', () => ({
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
}));

// Mock firebase/firestore
export const getDoc = vi.fn();
export const setDoc = vi.fn();
export const getDocs = vi.fn();
export const doc = vi.fn(() => ({}));
export const collection = vi.fn(() => ({}));
export const query = vi.fn(() => ({}));
export const where = vi.fn(() => ({}));
export const orderBy = vi.fn(() => ({}));
export const serverTimestamp = vi.fn(() => new Date());
export const getFirestore = vi.fn(() => ({}));

vi.mock('firebase/firestore', () => ({
  getFirestore,
  getDoc,
  setDoc,
  getDocs,
  doc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
}));

// Mock firebase/app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

// Mock src/firebase.js
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
}));
