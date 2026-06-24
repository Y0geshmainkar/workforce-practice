import { useEffect, useState } from 'react';
import { getPoliciesByClient } from '../services/firestore.service';

export function useClientPolicies(clientId) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    getPoliciesByClient(clientId)
      .then(setPolicies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [clientId]);

  return { policies, loading, error };
}
