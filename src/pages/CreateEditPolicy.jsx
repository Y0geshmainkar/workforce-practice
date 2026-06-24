import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../hooks/useClients';
import { createPolicy, updatePolicy, getPolicyById } from '../services/firestore.service';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const TYPES = ['Life', 'Health', 'Motor', 'Home', 'Travel', 'Other'];
const FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];
const STATUSES = ['Active', 'Pending Renewal'];

function toInputDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const EMPTY = { policyNumber: '', title: '', type: 'Life', insurer: '', sumInsured: '', premiumAmount: '', premiumFrequency: 'Annual', startDate: '', expiryDate: '', renewalDate: '', clientId: '', notes: '', status: 'Active' };

export default function CreateEditPolicy() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clients } = useClients(user?.uid);
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    getPolicyById(id).then((p) => {
      if (p) {
        setForm({
          policyNumber: p.policyNumber ?? '',
          title: p.title ?? '',
          type: p.type ?? 'Life',
          insurer: p.insurer ?? '',
          sumInsured: p.sumInsured ?? '',
          premiumAmount: p.premiumAmount ?? '',
          premiumFrequency: p.premiumFrequency ?? 'Annual',
          startDate: toInputDate(p.startDate),
          expiryDate: toInputDate(p.expiryDate),
          renewalDate: toInputDate(p.renewalDate),
          clientId: p.clientId ?? '',
          notes: p.notes ?? '',
          status: p.status ?? 'Active',
        });
      }
    }).finally(() => setLoadingPolicy(false));
  }, [id, isEdit]);

  function set(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'expiryDate' && value) {
        next.renewalDate = addDays(value, -30);
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const toTs = (s) => s ? Timestamp.fromDate(new Date(s)) : null;
      const selectedClient = clients.find((c) => c.id === form.clientId);
      const data = {
        ...form,
        sumInsured: Number(form.sumInsured),
        premiumAmount: Number(form.premiumAmount),
        startDate: toTs(form.startDate),
        expiryDate: toTs(form.expiryDate),
        renewalDate: toTs(form.renewalDate),
        agentId: user.uid,
        agentEmail: user.email,
        clientName: selectedClient?.displayName ?? selectedClient?.name ?? '',
        clientEmail: selectedClient?.email ?? '',
      };
      if (isEdit) {
        await updatePolicy(id, data);
      } else {
        await createPolicy(data);
      }
      showToast(`Policy ${isEdit ? 'updated' : 'created'} successfully.`);
      navigate('/policies');
    } catch {
      showToast('Failed to save policy.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loadingPolicy) return <AppLayout><p className="text-slate-500">Loading…</p></AppLayout>;

  const field = (label, key, type = 'text', opts = null) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {opts ? (
        <select
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
        >
          {opts.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          required={['policyNumber', 'insurer', 'sumInsured', 'premiumAmount', 'startDate', 'expiryDate'].includes(key)}
        />
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-6">{isEdit ? 'Edit Policy' : 'New Policy'}</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('Policy Number', 'policyNumber')}
            {field('Title', 'title')}
            {field('Type', 'type', 'text', TYPES)}
            {field('Insurer', 'insurer')}
            {field('Sum Insured (₹)', 'sumInsured', 'number')}
            {field('Premium Amount (₹)', 'premiumAmount', 'number')}
            {field('Premium Frequency', 'premiumFrequency', 'text', FREQUENCIES)}
            {field('Status', 'status', 'text', STATUSES)}
            {field('Start Date', 'startDate', 'date')}
            {field('Expiry Date', 'expiryDate', 'date')}
            {field('Renewal Date', 'renewalDate', 'date')}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                value={form.clientId}
                onChange={(e) => set('clientId', e.target.value)}
                required
              >
                <option value="">Select client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.displayName ?? c.name} ({c.email})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/policies')} className="px-4 py-2 text-sm border border-slate-300 rounded hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
