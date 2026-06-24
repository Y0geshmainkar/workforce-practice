import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../hooks/useClients';

export default function ClientList() {
  const { user } = useAuth();
  const { clients, loading } = useClients(user?.uid, user?.email);

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Clients</h1>
        <Link to="/clients/new" className="bg-blue-900 text-white text-sm px-4 py-2 rounded hover:bg-blue-800">
          + Add Client
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-4"><Skeleton rows={5} /></div>
        ) : clients.length === 0 ? (
          <EmptyState message="No clients yet. Add your first client." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{c.displayName ?? c.name}</td>
                    <td className="px-4 py-3 text-slate-500">{c.email}</td>
                    <td className="px-4 py-3 text-slate-500">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/policies?client=${c.id}`}
                        className="text-blue-900 text-xs hover:underline"
                      >
                        View Policies
                      </Link>
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
