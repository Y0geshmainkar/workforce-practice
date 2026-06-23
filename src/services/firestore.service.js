import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, query, where, getDocs, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

export async function createUserDoc(user, extra = {}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  // Don't overwrite existing user (preserves role)
  if (snap.exists()) return snap.data();
  const data = {
    uid: user.uid,
    email: user.email,
    name: extra.name || user.displayName || '',
    role: 'USER',
    provider: extra.provider || 'local',
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return data;
}

export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}


// ── Policies ──────────────────────────────────────────────

/** All policies — ADMIN use */
export async function getAllPolicies() {
  const snap = await getDocs(query(collection(db, 'policies'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Policies assigned to a specific user */
export async function getPoliciesForUser(uid) {
  const snap = await getDocs(
    query(collection(db, 'policies'), where('assignedTo', 'array-contains', uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** All users — ADMIN use */
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data());
}
