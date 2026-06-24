import { useEffect, useState } from 'react';
import { getClientsByAgent } from '../services/firestore.service';

export function useClients(agentId) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!agentId) return;
    getClientsByAgent(agentId)
      .then(setClients)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [agentId]);

  return { clients, loading, error };
}
