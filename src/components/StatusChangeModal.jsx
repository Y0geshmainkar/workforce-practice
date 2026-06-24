import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changeStatus } from '../services/firestore.service';
import { useToast } from '../context/ToastContext';

const STATUS_OPTIONS = ['Active', 'Pending Renewal', 'Lapsed', 'Cancelled', 'Expired'];

export default function StatusChangeModal({ isOpen, policyId, currentStatus, onClose, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) { setError('Reason is required.'); return; }
    setSaving(true);
    try {
      await changeStatus(policyId, status, user.uid, user.email, reason.trim());
      showToast('Status updated successfully.');
      onSuccess();
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Change Policy Status</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
            <select
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.filter((s) => s !== currentStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
            <textarea
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              rows={3}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="Describe the reason for this status change…"
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
