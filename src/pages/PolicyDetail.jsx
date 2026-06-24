import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import DaysLeftBadge from '../components/DaysLeftBadge';
import StatusChangeModal from '../components/StatusChangeModal';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { getPolicyById, getStatusHistory } from '../services/firestore.service';
import { useEffect } from 'react';

function fmtDate(ts) {
  if (!ts) return '—';
  return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value ?? '—'}</p>
    </div>
  );
}

export default function PolicyDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const isAdmin = role === 'ADMIN';

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getPolicyById(id), getStatusHistory(id)])
      .then(([p, h]) => { setPolicy(p); setHistory(h); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <AppLayout><div className="max-w-3xl mx-auto"><Skeleton rows={8} /></div></AppLayout>;
  if (!policy) return <AppLayout><p className="text-slate-500">Policy not found.</p></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-slate-500 font-mono mb-1">{policy.policyNumber}</p>
              <h1 className="text-xl font-bold text-slate-800">{policy.title ?? `${policy.type} Policy`}</h1>
              <p className="text-sm text-slate-500">{policy.type} · {policy.insurer}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={policy.status} />
              <DaysLeftBadge expiryDate={policy.expiryDate} />
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm px-3 py-1.5 bg-blue-900 text-white rounded hover:bg-blue-800"
              >
                Change Status
              </button>
              <Link
                to={`/policies/${id}/edit`}
                className="text-sm px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50"
              >
                Edit
              </Link>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Policy Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoRow label="Sum Insured" value={policy.sumInsured ? `₹${Number(policy.sumInsured).toLocaleString('en-IN')}` : null} />
            <InfoRow label="Premium" value={policy.premiumAmount ? `₹${Number(policy.premiumAmount).toLocaleString('en-IN')}` : null} />
            <InfoRow label="Frequency" value={policy.premiumFrequency} />
            <InfoRow label="Start Date" value={fmtDate(policy.startDate)} />
            <InfoRow label="Expiry Date" value={fmtDate(policy.expiryDate)} />
            <InfoRow label="Renewal Date" value={fmtDate(policy.renewalDate)} />
            <InfoRow label="Client" value={policy.clientName} />
          </div>
          {policy.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-700">{policy.notes}</p>
            </div>
          )}
        </div>

        {/* Status History */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Status History</h2>
          {!history?.length ? (
            <p className="text-sm text-slate-400">No status changes recorded.</p>
          ) : (
            <ol className="relative border-l border-slate-200 space-y-4 ml-2">
              {history.map((h) => (
                <li key={h.id} className="ml-4">
                  <div className="absolute -left-1.5 w-3 h-3 bg-blue-900 rounded-full border-2 border-white" />
                  <p className="text-xs text-slate-500">{fmtDate(h.changedAt)}</p>
                  <p className="text-sm font-medium text-slate-700">
                    {h.fromStatus} → {h.toStatus}
                  </p>
                  <p className="text-xs text-slate-500">by {h.changedByEmail}</p>
                  {h.note && <p className="text-xs text-slate-600 italic mt-0.5">&ldquo;{h.note}&rdquo;</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <StatusChangeModal
        isOpen={modalOpen}
        policyId={id}
        currentStatus={policy.status}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); load(); }}
      />
    </AppLayout>
  );
}
