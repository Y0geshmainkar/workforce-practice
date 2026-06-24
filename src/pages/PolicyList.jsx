import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import DaysLeftBadge from '../components/DaysLeftBadge';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { usePolicies } from '../hooks/usePolicies';

const TYPES = ['All', 'Life', 'Health', 'Motor', 'Home', 'Travel', 'Other'];
const STATUSES = ['All', 'Active', 'Pending Renewal', 'Lapsed', 'Cancelled', 'Expired'];

function fmtDate(ts) {
  if (!ts) return '—';
  return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PolicyList() {
  const { user } = useAuth();
  const { policies, loading } = usePolicies(user?.uid);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = (policies ?? [])
    .filter((p) => typeFilter === 'All' || p.type === typeFilter)
    .filter((p) => statusFilter === 'All' || p.status === statusFilter)
    .filter((p) => !search || p.policyNumber?.toLowerCase().includes(search.toLowerCase()) || p.insurer?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const diff = (a.expiryDate?.seconds ?? 0) - (b.expiryDate?.seconds ?? 0);
      return sortAsc ? diff : -diff;
    });

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">All Policies</h1>
        <Link to="/policies/new" className="bg-blue-900 text-white text-sm px-4 py-2 rounded hover:bg-blue-800">
          + Add Policy
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 mb-4 flex flex-wrap gap-3">
        <select
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search insurer or policy no…"
          className="border border-slate-300 rounded px-3 py-1.5 text-sm flex-1 min-w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-4"><Skeleton rows={6} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No policies match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Policy No.</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Insurer</th>
                  <th className="px-4 py-2 text-right">Sum Insured</th>
                  <th className="px-4 py-2 text-right">Premium</th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => setSortAsc(!sortAsc)}
                  >
                    Expiry {sortAsc ? '↑' : '↓'}
                  </th>
                  <th className="px-4 py-2 text-left">Days Left</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{p.policyNumber}</td>
                    <td className="px-4 py-3">{p.clientName ?? '—'}</td>
                    <td className="px-4 py-3">{p.type}</td>
                    <td className="px-4 py-3">{p.insurer}</td>
                    <td className="px-4 py-3 text-right">₹{Number(p.sumInsured).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">₹{Number(p.premiumAmount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{fmtDate(p.expiryDate)}</td>
                    <td className="px-4 py-3"><DaysLeftBadge expiryDate={p.expiryDate} /></td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <Link to={`/policies/${p.id}`} className="text-blue-900 text-xs hover:underline">View</Link>
                    </td>
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
