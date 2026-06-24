import { describe, it, expect, beforeEach, vi } from 'vitest';
import './firebase.mock';

// Mock the firestore service — renewal.service only calls these
vi.mock('../services/firestore.service', () => ({
  getPoliciesByStatus: vi.fn(),
  changeStatus: vi.fn(),
  createReminder: vi.fn(),
  getRemindersForAgent: vi.fn(),
}));

import {
  getPoliciesByStatus,
  changeStatus,
  createReminder,
  getRemindersForAgent,
} from '../services/firestore.service';
import { checkAndFlagExpiringPolicies } from '../services/renewal.service';

function makePolicy(id, daysUntilExpiry) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + daysUntilExpiry);
  return {
    id,
    policyNumber: `POL-00${id}`,
    clientId: 'c1',
    clientEmail: 'client@test.com',
    clientName: 'Alice',
    agentId: 'a1',
    status: 'Active',
    premiumAmount: 12000,
    expiryDate: { toDate: () => expiry },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  changeStatus.mockResolvedValue();
  createReminder.mockResolvedValue({ id: 'r-new' });
  getRemindersForAgent.mockResolvedValue([]);
});

describe('checkAndFlagExpiringPolicies', () => {
  it('flags a policy expiring in 20 days as Pending Renewal', async () => {
    getPoliciesByStatus.mockResolvedValue([makePolicy('p1', 20)]);

    await checkAndFlagExpiringPolicies('a1', 'agent@test.com');

    expect(changeStatus).toHaveBeenCalledWith(
      'p1', 'Pending Renewal', 'a1', 'agent@test.com',
      'Auto-flagged: expiry within 30 days'
    );
  });

  it('does NOT change status for a policy expiring in 60 days', async () => {
    getPoliciesByStatus.mockResolvedValue([makePolicy('p2', 60)]);

    await checkAndFlagExpiringPolicies('a1', 'agent@test.com');

    expect(changeStatus).not.toHaveBeenCalled();
  });

  it('creates a 30-day-expiry reminder for policy expiring in 20 days', async () => {
    getPoliciesByStatus.mockResolvedValue([makePolicy('p3', 20)]);

    await checkAndFlagExpiringPolicies('a1', 'agent@test.com');

    expect(createReminder).toHaveBeenCalledWith(
      expect.objectContaining({ type: '30-day-expiry', policyId: 'p3' })
    );
  });

  it('creates a 7-day-expiry reminder for policy expiring in 5 days', async () => {
    getPoliciesByStatus.mockResolvedValue([makePolicy('p4', 5)]);

    await checkAndFlagExpiringPolicies('a1', 'agent@test.com');

    expect(createReminder).toHaveBeenCalledWith(
      expect.objectContaining({ type: '7-day-expiry', policyId: 'p4' })
    );
  });

  it('creates a 1-day-expiry reminder for policy expiring in 1 day', async () => {
    getPoliciesByStatus.mockResolvedValue([makePolicy('p5', 1)]);

    await checkAndFlagExpiringPolicies('a1', 'agent@test.com');

    expect(createReminder).toHaveBeenCalledWith(
      expect.objectContaining({ type: '1-day-expiry', policyId: 'p5' })
    );
  });

  it('does NOT create duplicate reminder if one already exists', async () => {
    getPoliciesByStatus.mockResolvedValue([makePolicy('p6', 20)]);
    getRemindersForAgent.mockResolvedValue([
      { policyId: 'p6', type: '30-day-expiry' },
    ]);

    await checkAndFlagExpiringPolicies('a1', 'agent@test.com');

    expect(createReminder).not.toHaveBeenCalled();
  });

  it('handles multiple policies independently', async () => {
    getPoliciesByStatus.mockResolvedValue([
      makePolicy('pa', 20),  // within 30 days → flag
      makePolicy('pb', 60),  // outside 30 days → skip
    ]);

    await checkAndFlagExpiringPolicies('a1', 'agent@test.com');

    expect(changeStatus).toHaveBeenCalledTimes(1);
    expect(changeStatus).toHaveBeenCalledWith('pa', 'Pending Renewal', expect.any(String), expect.any(String), expect.any(String));
  });
});
