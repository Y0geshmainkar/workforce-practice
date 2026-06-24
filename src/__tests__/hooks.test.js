import { renderHook, waitFor } from '@testing-library/react';
import { usePolicies } from '../hooks/usePolicies';
import { useClientPolicies } from '../hooks/useClientPolicies';
import { usePolicyDetail } from '../hooks/usePolicyDetail';
import { useExpiringPolicies } from '../hooks/useExpiringPolicies';
import { useClients } from '../hooks/useClients';
import { useReminders } from '../hooks/useReminders';
import { usePolicyStats } from '../hooks/usePolicyStats';

vi.mock('../services/firestore.service', () => ({
  getPoliciesByAgent: vi.fn(),
  getPoliciesByClient: vi.fn(),
  getPolicyById: vi.fn(),
  getStatusHistory: vi.fn(),
  getExpiringPolicies: vi.fn(),
  getClientsByAgent: vi.fn(),
  getRemindersForAgent: vi.fn(),
  getRemindersForClient: vi.fn(),
  markReminderRead: vi.fn(),
  markAllRemindersRead: vi.fn(),
  getUnreadReminderCount: vi.fn(),
}));

import {
  getPoliciesByAgent, getPoliciesByClient, getPolicyById, getStatusHistory,
  getExpiringPolicies, getClientsByAgent,
  getRemindersForAgent, getRemindersForClient,
  markReminderRead, markAllRemindersRead, getUnreadReminderCount,
} from '../services/firestore.service';

// ── usePolicies ───────────────────────────────────────────

describe('usePolicies', () => {
  it('loading starts true', () => {
    getPoliciesByAgent.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePolicies('agent1'));
    expect(result.current.loading).toBe(true);
  });

  it('sets policies and grouped on resolve', async () => {
    const data = [
      { id: '1', status: 'Active' },
      { id: '2', status: 'Active' },
      { id: '3', status: 'Lapsed' },
    ];
    getPoliciesByAgent.mockResolvedValue(data);
    const { result } = renderHook(() => usePolicies('agent1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.policies).toEqual(data);
    expect(result.current.grouped.Active).toHaveLength(2);
    expect(result.current.grouped.Lapsed).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('sets error on reject', async () => {
    getPoliciesByAgent.mockRejectedValue(new Error('fetch failed'));
    const { result } = renderHook(() => usePolicies('agent1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('fetch failed');
    expect(result.current.policies).toEqual([]);
  });

  it('does not fetch when agentId is falsy', () => {
    getPoliciesByAgent.mockClear();
    renderHook(() => usePolicies(null));
    expect(getPoliciesByAgent).not.toHaveBeenCalled();
  });
});

// ── useClientPolicies ─────────────────────────────────────

describe('useClientPolicies', () => {
  it('loading starts true', () => {
    getPoliciesByClient.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClientPolicies('client1'));
    expect(result.current.loading).toBe(true);
  });

  it('sets policies on resolve', async () => {
    const data = [{ id: 'p1' }];
    getPoliciesByClient.mockResolvedValue(data);
    const { result } = renderHook(() => useClientPolicies('client1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.policies).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it('sets error on reject', async () => {
    getPoliciesByClient.mockRejectedValue(new Error('client err'));
    const { result } = renderHook(() => useClientPolicies('client1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('client err');
  });
});

// ── usePolicyDetail ───────────────────────────────────────

describe('usePolicyDetail', () => {
  it('loading starts true', () => {
    getPolicyById.mockReturnValue(new Promise(() => {}));
    getStatusHistory.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePolicyDetail('pol1'));
    expect(result.current.loading).toBe(true);
  });

  it('sets policy and statusHistory on resolve', async () => {
    const policy = { id: 'pol1', status: 'Active' };
    const history = [{ id: 'h1', from: 'Pending', to: 'Active' }];
    getPolicyById.mockResolvedValue(policy);
    getStatusHistory.mockResolvedValue(history);
    const { result } = renderHook(() => usePolicyDetail('pol1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.policy).toEqual(policy);
    expect(result.current.statusHistory).toEqual(history);
    expect(result.current.error).toBeNull();
  });

  it('sets error on reject', async () => {
    getPolicyById.mockRejectedValue(new Error('not found'));
    getStatusHistory.mockResolvedValue([]);
    const { result } = renderHook(() => usePolicyDetail('pol1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('not found');
  });
});

// ── useExpiringPolicies ───────────────────────────────────

describe('useExpiringPolicies', () => {
  it('loading starts true', () => {
    getExpiringPolicies.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useExpiringPolicies('agent1'));
    expect(result.current.loading).toBe(true);
  });

  it('sorts by expiryDate.seconds on resolve', async () => {
    const data = [
      { id: 'b', expiryDate: { seconds: 200 } },
      { id: 'a', expiryDate: { seconds: 100 } },
    ];
    getExpiringPolicies.mockResolvedValue(data);
    const { result } = renderHook(() => useExpiringPolicies('agent1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.policies[0].id).toBe('a');
    expect(result.current.policies[1].id).toBe('b');
  });

  it('sets error on reject', async () => {
    getExpiringPolicies.mockRejectedValue(new Error('exp err'));
    const { result } = renderHook(() => useExpiringPolicies('agent1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('exp err');
  });
});

// ── useClients ────────────────────────────────────────────

describe('useClients', () => {
  it('loading starts true', () => {
    getClientsByAgent.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useClients('agent1'));
    expect(result.current.loading).toBe(true);
  });

  it('sets clients on resolve', async () => {
    const data = [{ id: 'c1', name: 'Alice' }];
    getClientsByAgent.mockResolvedValue(data);
    const { result } = renderHook(() => useClients('agent1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.clients).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it('sets error on reject', async () => {
    getClientsByAgent.mockRejectedValue(new Error('clients err'));
    const { result } = renderHook(() => useClients('agent1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('clients err');
  });
});

// ── useReminders ──────────────────────────────────────────

describe('useReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRemindersForAgent.mockResolvedValue([]);
    getRemindersForClient.mockResolvedValue([]);
    getUnreadReminderCount.mockResolvedValue(0);
    markReminderRead.mockResolvedValue();
    markAllRemindersRead.mockResolvedValue();
  });

  it('loading starts true', () => {
    getRemindersForAgent.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useReminders('uid1', 'ADMIN'));
    expect(result.current.loading).toBe(true);
  });

  it('ADMIN: fetches agent reminders and unread count', async () => {
    const data = [{ id: 'r1', read: false }];
    getRemindersForAgent.mockResolvedValue(data);
    getUnreadReminderCount.mockResolvedValue(1);
    const { result } = renderHook(() => useReminders('uid1', 'ADMIN'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toEqual(data);
    expect(result.current.unreadCount).toBe(1);
    expect(getRemindersForClient).not.toHaveBeenCalled();
  });

  it('USER: fetches client reminders, no unread count', async () => {
    const data = [{ id: 'r2', read: true }];
    getRemindersForClient.mockResolvedValue(data);
    const { result } = renderHook(() => useReminders('uid2', 'USER'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toEqual(data);
    expect(getUnreadReminderCount).not.toHaveBeenCalled();
  });

  it('sets error on reject', async () => {
    getRemindersForAgent.mockRejectedValue(new Error('rem err'));
    const { result } = renderHook(() => useReminders('uid1', 'ADMIN'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('rem err');
  });

  it('markRead calls service and refreshes', async () => {
    const { result } = renderHook(() => useReminders('uid1', 'ADMIN'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.clearAllMocks();
    getRemindersForAgent.mockResolvedValue([]);
    getUnreadReminderCount.mockResolvedValue(0);
    markReminderRead.mockResolvedValue();
    await result.current.markRead('r1');
    expect(markReminderRead).toHaveBeenCalledWith('r1');
    expect(getRemindersForAgent).toHaveBeenCalledTimes(1);
  });

  it('markAllRead calls service and refreshes', async () => {
    const { result } = renderHook(() => useReminders('uid1', 'ADMIN'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.clearAllMocks();
    getRemindersForAgent.mockResolvedValue([]);
    getUnreadReminderCount.mockResolvedValue(0);
    markAllRemindersRead.mockResolvedValue();
    await result.current.markAllRead();
    expect(markAllRemindersRead).toHaveBeenCalledWith('uid1');
    expect(getRemindersForAgent).toHaveBeenCalledTimes(1);
  });
});

// ── usePolicyStats ────────────────────────────────────────

describe('usePolicyStats', () => {
  it('loading starts true', () => {
    getPoliciesByAgent.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePolicyStats('agent1'));
    expect(result.current.loading).toBe(true);
  });

  it('computes stats correctly', async () => {
    const now = new Date();
    const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const data = [
      { status: 'Active', premiumAmount: 100, expiryDate: { toDate: () => inTenDays } },
      { status: 'Active', premiumAmount: 200, expiryDate: null },
      { status: 'Pending Renewal', premiumAmount: 300, expiryDate: null },
      { status: 'Lapsed', premiumAmount: 50, expiryDate: null },
    ];
    getPoliciesByAgent.mockResolvedValue(data);
    const { result } = renderHook(() => usePolicyStats('agent1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const { stats } = result.current;
    expect(stats.total).toBe(4);
    expect(stats.active).toBe(2);
    expect(stats.pendingRenewal).toBe(1);
    expect(stats.lapsed).toBe(1);
    expect(stats.expiringThisMonth).toBe(1);
    expect(stats.premiumAtRisk).toBe(300);
  });

  it('does not fetch when agentId is falsy', () => {
    getPoliciesByAgent.mockClear();
    renderHook(() => usePolicyStats(null));
    expect(getPoliciesByAgent).not.toHaveBeenCalled();
  });
});
