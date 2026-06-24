import { useEffect, useState } from 'react';
import { getPoliciesByAgent } from '../services/firestore.service';

export function usePolicies(agentId) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!agentId) return;
    getPoliciesByAgent(agentId)
      .then(setPolicies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [agentId]);

  const grouped = policies.reduce((acc, p) => {
    acc[p.status] = acc[p.status] || [];
    acc[p.status].push(p);
    return acc;
  }, {});

  return { policies, grouped, loading, error };
}
