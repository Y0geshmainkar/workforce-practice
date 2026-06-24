import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useClientPolicies } from '../hooks/useClientPolicies';

function fmtDate(ts) {
  if (!ts) return '—';
  return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLeft(ts) {
  if (!ts) return Infinity;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return Math.ceil((d - Date.now()) / 86400000);
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const { policies, loading } = useClientPolicies(user?.uid);
  const name = user?.displayName ?? user?.email?.split('@')[0] ?? 'there';

  const soonExpiring = (policies ?? []).filter((p) => daysLeft(p.expiryDate) <= 30 && daysLeft(p.expiryDate) > 0);

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-slate-800 mb-1">Your Policies, {name}</h1>
      <p className="text-sm text-slate-500 mb-4">Overview of all your active insurance policies.</p>

      {!loading && soonExpiring.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded mb-4">
          ⚠️ {soonExpiring.length} policy/policies expiring within 30 days. Please renew promptly.
        </div>
      )}

      {loading ? (
        <Skeleton rows={4} type="card" />
      ) : policies?.length === 0 ? (
        <EmptyState message="No policies found for your account." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs text-slate-500">{p.policyNumber}</span>
                <StatusBadge status={p.status} />
              </div>
              <p className="font-semibold text-slate-800">{p.type} — {p.insurer}</p>
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex justify-between"><span>Sum Insured</span><span className="font-medium text-slate-700">₹{Number(p.sumInsured).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Premium</span><span className="font-medium text-slate-700">₹{Number(p.premiumAmount).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Expiry</span><span className="font-medium text-slate-700">{fmtDate(p.expiryDate)}</span></div>
              </div>
              <Link to={`/policies/${p.id}`} className="block text-center text-xs text-blue-900 border border-blue-900 rounded py-1.5 hover:bg-blue-50 mt-2">
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
