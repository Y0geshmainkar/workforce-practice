import { describe, it, expect, beforeEach, vi } from 'vitest';
import './firebase.mock';
import {
  addDoc, updateDoc, getDoc, setDoc, getDocs, doc, collection, query, where, orderBy, serverTimestamp,
} from './firebase.mock';
import {
  createPolicy, updatePolicy, deletePolicy, getPolicyById,
  getPoliciesByAgent, changeStatus, getStatusHistory,
  createReminder, markReminderRead, getUnreadReminderCount, createClient,
} from '../services/firestore.service';

beforeEach(() => {
  vi.clearAllMocks();
  serverTimestamp.mockReturnValue('__ts__');
  doc.mockImplementation((_db, ...segments) => ({ path: segments.join('/') }));
  collection.mockImplementation((_db, ...segments) => ({ path: segments.join('/') }));
  query.mockImplementation((ref) => ref);
  where.mockReturnValue({});
  orderBy.mockReturnValue({});
  addDoc.mockResolvedValue({ id: 'new-id' });
  updateDoc.mockResolvedValue();
  setDoc.mockResolvedValue();
});

// ── createPolicy ──────────────────────────────────────────
describe('createPolicy', () => {
  it('calls addDoc on policies collection with timestamps', async () => {
    await createPolicy({ agentId: 'a1', policyNumber: 'P-001' });
    expect(addDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'policies' }),
      expect.objectContaining({ agentId: 'a1', policyNumber: 'P-001', createdAt: '__ts__', updatedAt: '__ts__' })
    );
  });
});

// ── updatePolicy ──────────────────────────────────────────
describe('updatePolicy', () => {
  it('calls updateDoc with updatedAt timestamp', async () => {
    await updatePolicy('p1', { status: 'Active' });
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'policies/p1' }),
      expect.objectContaining({ status: 'Active', updatedAt: '__ts__' })
    );
  });
});

// ── deletePolicy ──────────────────────────────────────────
describe('deletePolicy', () => {
  it('soft-deletes by setting status to Cancelled', async () => {
    await deletePolicy('p1');
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'policies/p1' }),
      expect.objectContaining({ status: 'Cancelled' })
    );
  });
});

// ── getPolicyById ─────────────────────────────────────────
describe('getPolicyById', () => {
  it('returns policy data when doc exists', async () => {
    getDoc.mockResolvedValue({ exists: () => true, id: 'p1', data: () => ({ agentId: 'a1' }) });
    const result = await getPolicyById('p1');
    expect(result).toEqual({ id: 'p1', agentId: 'a1' });
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'policies', 'p1');
  });

  it('returns null when doc does not exist', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    const result = await getPolicyById('p1');
    expect(result).toBeNull();
  });
});

// ── getPoliciesByAgent ────────────────────────────────────
describe('getPoliciesByAgent', () => {
  it('queries policies with agentId filter and orderBy createdAt desc', async () => {
    getDocs.mockResolvedValue({ docs: [{ id: 'p1', data: () => ({ agentId: 'a1' }) }] });
    const result = await getPoliciesByAgent('a1');
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'policies');
    expect(where).toHaveBeenCalledWith('agentId', '==', 'a1');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(result).toEqual([{ id: 'p1', agentId: 'a1' }]);
  });
});

// ── changeStatus ──────────────────────────────────────────
describe('changeStatus', () => {
  beforeEach(() => {
    getDoc.mockResolvedValue({ exists: () => true, id: 'p1', data: () => ({ status: 'Active' }) });
  });

  it('updates policy doc with new status', async () => {
    await changeStatus('p1', 'Lapsed', 'uid1', 'agent@test.com', 'expired');
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'policies/p1' }),
      expect.objectContaining({ status: 'Lapsed', lastStatusChangedBy: 'uid1' })
    );
  });

  it('writes to statusHistory subcollection with fromStatus and toStatus', async () => {
    await changeStatus('p1', 'Lapsed', 'uid1', 'agent@test.com', 'expired');
    expect(addDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'policies/p1/statusHistory' }),
      expect.objectContaining({
        fromStatus: 'Active',
        toStatus: 'Lapsed',
        changedBy: 'uid1',
        changedByEmail: 'agent@test.com',
        note: 'expired',
      })
    );
  });
});

// ── getStatusHistory ──────────────────────────────────────
describe('getStatusHistory', () => {
  it('queries statusHistory subcollection ordered by changedAt desc', async () => {
    getDocs.mockResolvedValue({ docs: [{ id: 'h1', data: () => ({ toStatus: 'Lapsed' }) }] });
    const result = await getStatusHistory('p1');
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'policies', 'p1', 'statusHistory');
    expect(orderBy).toHaveBeenCalledWith('changedAt', 'desc');
    expect(result).toEqual([{ id: 'h1', toStatus: 'Lapsed' }]);
  });
});

// ── createReminder ────────────────────────────────────────
describe('createReminder', () => {
  it('adds reminder with createdAt timestamp', async () => {
    await createReminder({ agentId: 'a1', policyId: 'p1', read: false });
    expect(addDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'reminders' }),
      expect.objectContaining({ agentId: 'a1', policyId: 'p1', read: false, createdAt: '__ts__' })
    );
  });
});

// ── markReminderRead ──────────────────────────────────────
describe('markReminderRead', () => {
  it('updates reminder doc with read: true', async () => {
    await markReminderRead('r1');
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'reminders/r1' }),
      { read: true }
    );
  });
});

// ── getUnreadReminderCount ────────────────────────────────
describe('getUnreadReminderCount', () => {
  it('returns count of unread reminders', async () => {
    getDocs.mockResolvedValue({ docs: [{ id: 'r1' }, { id: 'r2' }] });
    const count = await getUnreadReminderCount('a1');
    expect(where).toHaveBeenCalledWith('agentId', '==', 'a1');
    expect(where).toHaveBeenCalledWith('read', '==', false);
    expect(count).toBe(2);
  });
});

// ── createClient ──────────────────────────────────────────
describe('createClient', () => {
  it('uses setDoc with clients/{uid} path and adds createdAt', async () => {
    await createClient({ uid: 'c1', name: 'Alice', agentId: 'a1' });
    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'clients/c1' }),
      expect.objectContaining({ uid: 'c1', name: 'Alice', agentId: 'a1', createdAt: '__ts__' })
    );
  });
});
