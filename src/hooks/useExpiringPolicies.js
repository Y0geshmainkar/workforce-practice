import { useEffect, useState } from 'react';
import { getExpiringPolicies } from '../services/firestore.service';

export function useExpiringPolicies(agentId, daysAhead = 30) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!agentId) return;
    getExpiringPolicies(agentId, daysAhead)
      .then((p) => setPolicies([...p].sort((a, b) => a.expiryDate.seconds - b.expiryDate.seconds)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [agentId, daysAhead]);

  return { policies, loading, error };
}
