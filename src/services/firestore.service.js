import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Helpers ───────────────────────────────────────────────

const snap2arr = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// ── Users ─────────────────────────────────────────────────

/**
 * Create a Firestore user document if it does not already exist.
 * @param {{ uid: string, email: string, displayName?: string }} user
 * @param {{ name?: string, provider?: string }} extra
 * @returns {Promise<object>}
 */
export async function createUserDoc(user, extra = {}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
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

/**
 * Fetch a user document by UID.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Fetch all user documents (ADMIN only).
 * @returns {Promise<object[]>}
 */
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data());
}

// ── Policy CRUD ───────────────────────────────────────────

/**
 * Create a new policy document.
 * @param {object} policyData
 * @returns {Promise<import('firebase/firestore').DocumentReference>}
 */
export async function createPolicy(policyData) {
  return addDoc(collection(db, 'policies'), {
    ...policyData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update a policy document.
 * @param {string} policyId
 * @param {object} updates
 * @returns {Promise<void>}
 */
export async function updatePolicy(policyId, updates) {
  return updateDoc(doc(db, 'policies', policyId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-delete a policy by setting status to 'Cancelled'.
 * @param {string} policyId
 * @returns {Promise<void>}
 */
export async function deletePolicy(policyId) {
  return updatePolicy(policyId, { status: 'Cancelled' });
}

/**
 * Fetch a single policy by ID.
 * @param {string} policyId
 * @returns {Promise<object|null>}
 */
export async function getPolicyById(policyId) {
  const snap = await getDoc(doc(db, 'policies', policyId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Fetch all policies for a given agent, newest first.
 * @param {string} agentId
 * @returns {Promise<object[]>}
 */
export async function getPoliciesByAgent(agentId) {
  const snap = await getDocs(
    query(collection(db, 'policies'), where('agentId', '==', agentId), orderBy('createdAt', 'desc'))
  );
  return snap2arr(snap);
}

/**
 * Fetch all policies for a given client.
 * @param {string} clientId
 * @returns {Promise<object[]>}
 */
export async function getPoliciesByClient(clientId) {
  const snap = await getDocs(
    query(collection(db, 'policies'), where('clientId', '==', clientId))
  );
  return snap2arr(snap);
}

/**
 * Fetch policies for an agent filtered by status.
 * @param {string} agentId
 * @param {string} status
 * @returns {Promise<object[]>}
 */
export async function getPoliciesByStatus(agentId, status) {
  const snap = await getDocs(
    query(
      collection(db, 'policies'),
      where('agentId', '==', agentId),
      where('status', '==', status)
    )
  );
  return snap2arr(snap);
}

// ── Renewal Queries ───────────────────────────────────────

/**
 * Fetch active policies expiring within daysAhead days for an agent.
 * @param {string} agentId
 * @param {number} daysAhead
 * @returns {Promise<object[]>}
 */
export async function getExpiringPolicies(agentId, daysAhead) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const snap = await getDocs(
    query(
      collection(db, 'policies'),
      where('agentId', '==', agentId),
      where('status', '==', 'Active'),
      where('expiryDate', '<=', Timestamp.fromDate(cutoff))
    )
  );
  return snap2arr(snap);
}

/**
 * Fetch lapsed policies for an agent.
 * @param {string} agentId
 * @returns {Promise<object[]>}
 */
export function getLapsedPolicies(agentId) {
  return getPoliciesByStatus(agentId, 'Lapsed');
}

/**
 * Fetch policies pending renewal for an agent.
 * @param {string} agentId
 * @returns {Promise<object[]>}
 */
export function getPoliciesDueRenewal(agentId) {
  return getPoliciesByStatus(agentId, 'Pending Renewal');
}

// ── Status Management ─────────────────────────────────────

/**
 * Change a policy's status and write a history entry to the statusHistory subcollection.
 * @param {string} policyId
 * @param {string} newStatus
 * @param {string} changedByUid
 * @param {string} changedByEmail
 * @param {string} [note]
 * @returns {Promise<void>}
 */
export async function changeStatus(policyId, newStatus, changedByUid, changedByEmail, note = '') {
  const current = await getPolicyById(policyId);
  const fromStatus = current?.status ?? null;

  await updateDoc(doc(db, 'policies', policyId), {
    status: newStatus,
    lastStatusChange: serverTimestamp(),
    lastStatusChangedBy: changedByUid,
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'policies', policyId, 'statusHistory'), {
    fromStatus,
    toStatus: newStatus,
    changedBy: changedByUid,
    changedByEmail,
    changedAt: serverTimestamp(),
    note,
  });
}

/**
 * Fetch the status history for a policy, newest first.
 * @param {string} policyId
 * @returns {Promise<object[]>}
 */
export async function getStatusHistory(policyId) {
  const snap = await getDocs(
    query(collection(db, 'policies', policyId, 'statusHistory'), orderBy('changedAt', 'desc'))
  );
  return snap2arr(snap);
}

// ── Reminders ─────────────────────────────────────────────

/**
 * Create a reminder document.
 * @param {object} reminderData
 * @returns {Promise<import('firebase/firestore').DocumentReference>}
 */
export async function createReminder(reminderData) {
  return addDoc(collection(db, 'reminders'), {
    ...reminderData,
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch all reminders for an agent, newest first.
 * @param {string} agentId
 * @returns {Promise<object[]>}
 */
export async function getRemindersForAgent(agentId) {
  const snap = await getDocs(
    query(collection(db, 'reminders'), where('agentId', '==', agentId), orderBy('createdAt', 'desc'))
  );
  return snap2arr(snap);
}

/**
 * Fetch all reminders for a client.
 * @param {string} clientId
 * @returns {Promise<object[]>}
 */
export async function getRemindersForClient(clientId) {
  const snap = await getDocs(
    query(collection(db, 'reminders'), where('clientId', '==', clientId))
  );
  return snap2arr(snap);
}

/**
 * Mark a single reminder as read.
 * @param {string} reminderId
 * @returns {Promise<void>}
 */
export async function markReminderRead(reminderId) {
  return updateDoc(doc(db, 'reminders', reminderId), { read: true });
}

/**
 * Mark all unread reminders for an agent as read.
 * @param {string} agentId
 * @returns {Promise<void>}
 */
export async function markAllRemindersRead(agentId) {
  const snap = await getDocs(
    query(collection(db, 'reminders'), where('agentId', '==', agentId), where('read', '==', false))
  );
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
}

/**
 * Get count of unread reminders for an agent.
 * @param {string} agentId
 * @returns {Promise<number>}
 */
export async function getUnreadReminderCount(agentId) {
  const snap = await getDocs(
    query(collection(db, 'reminders'), where('agentId', '==', agentId), where('read', '==', false))
  );
  return snap.docs.length;
}

// ── Clients ───────────────────────────────────────────────

/**
 * Create a client document keyed by clientData.uid.
 * @param {{ uid: string, [key: string]: any }} clientData
 * @returns {Promise<void>}
 */
export async function createClient(clientData) {
  return setDoc(doc(db, 'clients', clientData.uid), {
    ...clientData,
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch all clients for a given agent.
 * @param {string} agentId
 * @returns {Promise<object[]>}
 */
export async function getClientsByAgent(agentId) {
  const snap = await getDocs(
    query(collection(db, 'clients'), where('agentId', '==', agentId))
  );
  return snap2arr(snap);
}

/**
 * Fetch a single client by ID.
 * @param {string} clientId
 * @returns {Promise<object|null>}
 */
export async function getClientById(clientId) {
  const snap = await getDoc(doc(db, 'clients', clientId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Update a client document.
 * @param {string} clientId
 * @param {object} updates
 * @returns {Promise<void>}
 */
export async function updateClient(clientId, updates) {
  return updateDoc(doc(db, 'clients', clientId), updates);
}
