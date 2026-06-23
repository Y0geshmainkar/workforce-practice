import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllPolicies, getPoliciesForUser } from '../services/firestore.service';

export function usePolicies() {
  const { user, isAdmin } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetch = isAdmin() ? getAllPolicies : () => getPoliciesForUser(user.uid);
    fetch()
      .then(setPolicies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  return { policies, loading, error };
}
