import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import DaysLeftBadge from '../components/DaysLeftBadge';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { usePolicyStats } from '../hooks/usePolicyStats';
import { useExpiringPolicies } from '../hooks/useExpiringPolicies';
import { usePolicies } from '../hooks/usePolicies';
import { checkAndFlagExpiringPolicies } from '../services/renewal.service';

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? 'text-slate-800'}`}>{value ?? '—'}</p>
    </div>
  );
}

function fmtDate(ts) {
  if (!ts) return '—';
  return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = usePolicyStats(user?.uid);
  const { policies: expiring, loading: expLoading } = useExpiringPolicies(user?.uid, 7);
  const { policies, loading: polLoading } = usePolicies(user?.uid);

  useEffect(() => {
    if (user?.uid) checkAndFlagExpiringPolicies(user.uid, user.email).catch(() => {});
  }, [user]);

  const upcoming = [...(policies ?? [])]
    .sort((a, b) => (a.expiryDate?.seconds ?? 0) - (b.expiryDate?.seconds ?? 0))
    .slice(0, 5);

  return (
    <AppLayout>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Agent Dashboard</h1>

      {!expLoading && expiring?.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded mb-4">
          ⚠️ {expiring.length} policy/policies expiring within 7 days!{' '}
          <Link to="/policies" className="underline font-medium">View all</Link>
        </div>
      )}

      {statsLoading ? (
        <Skeleton rows={1} type="card" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <StatCard label="Total" value={stats?.total} />
          <StatCard label="Active" value={stats?.active} accent="text-green-700" />
          <StatCard label="Pending Renewal" value={stats?.pendingRenewal} accent="text-amber-700" />
          <StatCard label="Lapsed" value={stats?.lapsed} accent="text-red-700" />
          <StatCard label="Expiring This Month" value={stats?.expiringThisMonth} accent="text-orange-600" />
          <StatCard label="Premium at Risk" value={stats?.premiumAtRisk != null ? `₹${stats.premiumAtRisk.toLocaleString('en-IN')}` : '—'} accent="text-blue-900" />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-100">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-700 text-sm">Expiring Soon (top 5)</h2>
          <Link to="/policies" className="text-xs text-blue-900 hover:underline">View all →</Link>
        </div>
        {polLoading ? (
          <div className="p-4"><Skeleton rows={5} /></div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 p-6 text-center">No upcoming expirations.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  {['Policy No.', 'Client', 'Type', 'Insurer', 'Expiry Date', 'Days Left', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link to={`/policies/${p.id}`} className="text-blue-900 hover:underline">{p.policyNumber}</Link>
                    </td>
                    <td className="px-4 py-3">{p.clientName ?? '—'}</td>
                    <td className="px-4 py-3">{p.type}</td>
                    <td className="px-4 py-3">{p.insurer}</td>
                    <td className="px-4 py-3">{fmtDate(p.expiryDate)}</td>
                    <td className="px-4 py-3"><DaysLeftBadge expiryDate={p.expiryDate} /></td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
