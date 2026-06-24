import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { createClient } from '../services/firestore.service';
import { useToast } from '../context/ToastContext';
import { doc } from 'firebase/firestore';
import { db } from '../firebase';

const EMPTY = { displayName: '', email: '', phone: '', dateOfBirth: '', address: '' };

export default function AddClient() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Generate a unique id for the client
      const clientId = `${user.uid}_${Date.now()}`;
      await createClient({
        uid: clientId,
        ...form,
        agentId: user.uid,
      });
      showToast('Client added successfully.');
      navigate('/clients');
    } catch {
      showToast('Failed to add client.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const f = (label, key, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required={required}
      />
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-6">Add Client</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 space-y-4">
          {f('Full Name', 'displayName', 'text', true)}
          {f('Email', 'email', 'email', true)}
          {f('Phone', 'phone')}
          {f('Date of Birth', 'dateOfBirth', 'date')}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/clients')} className="px-4 py-2 text-sm border border-slate-300 rounded hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
