import AppLayout from '../components/AppLayout';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../hooks/useReminders';

function fmtDate(ts) {
  if (!ts) return '—';
  return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Reminders() {
  const { user, role } = useAuth();
  const { reminders, markAllRead, loading } = useReminders(user?.uid, role);

  const grouped = reminders.reduce((acc, r) => {
    const key = r.type ?? 'general';
    acc[key] = acc[key] ?? [];
    acc[key].push(r);
    return acc;
  }, {});

  const isAdmin = role === 'ADMIN';

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Reminders</h1>
        {isAdmin && reminders.some((r) => !r.read) && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-900 border border-blue-900 rounded px-3 py-1.5 hover:bg-blue-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : reminders.length === 0 ? (
        <EmptyState message="No reminders." />
      ) : isAdmin ? (
        // Grouped by type for agent
        Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="mb-6">
            <h2 className="text-xs uppercase text-slate-500 font-semibold mb-2 tracking-wide">{type.replace(/-/g, ' ')}</h2>
            <ReminderTable items={items} />
          </div>
        ))
      ) : (
        <ReminderTable items={reminders} />
      )}
    </AppLayout>
  );
}

function ReminderTable({ items }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-2 text-left w-4"></th>
            <th className="px-4 py-2 text-left">Policy No.</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Message</th>
            <th className="px-4 py-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((r) => (
            <tr key={r.id} className={r.read ? 'text-slate-400' : 'font-medium'}>
              <td className="px-4 py-3">
                <span className={`inline-block w-2 h-2 rounded-full ${r.read ? 'bg-slate-200' : 'bg-blue-600'}`} />
              </td>
              <td className="px-4 py-3 font-mono text-xs">{r.policyNumber ?? '—'}</td>
              <td className="px-4 py-3">{r.type ?? '—'}</td>
              <td className="px-4 py-3 max-w-xs truncate">{r.message}</td>
              <td className="px-4 py-3 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
