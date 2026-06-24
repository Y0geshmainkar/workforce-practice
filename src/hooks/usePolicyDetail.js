import { useEffect, useState } from 'react';
import { getPolicyById, getStatusHistory } from '../services/firestore.service';

export function usePolicyDetail(policyId) {
  const [policy, setPolicy] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!policyId) return;
    Promise.all([getPolicyById(policyId), getStatusHistory(policyId)])
      .then(([p, history]) => { setPolicy(p); setStatusHistory(history); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [policyId]);

  return { policy, statusHistory, loading, error };
}
