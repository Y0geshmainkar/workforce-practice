import { useEffect, useState } from 'react';
import { getPoliciesByAgent } from '../services/firestore.service';

export function usePolicyStats(agentId) {
  const [stats, setStats] = useState({
    total: 0, active: 0, pendingRenewal: 0, lapsed: 0, expiringThisMonth: 0, premiumAtRisk: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;
    getPoliciesByAgent(agentId).then((policies) => {
      const now = new Date();
      const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setStats({
        total: policies.length,
        active: policies.filter((p) => p.status === 'Active').length,
        pendingRenewal: policies.filter((p) => p.status === 'Pending Renewal').length,
        lapsed: policies.filter((p) => p.status === 'Lapsed').length,
        expiringThisMonth: policies.filter((p) => {
          const exp = p.expiryDate?.toDate?.();
          return exp && exp <= thirtyDaysOut && exp >= now;
        }).length,
        premiumAtRisk: policies
          .filter((p) => p.status === 'Pending Renewal')
          .reduce((sum, p) => sum + (p.premiumAmount || 0), 0),
      });
    }).finally(() => setLoading(false));
  }, [agentId]);

  return { stats, loading };
}
