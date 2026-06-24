export default function StatusBadge({ status }) {
  const map = {
    Active: 'text-green-700 bg-green-100',
    'Pending Renewal': 'text-amber-700 bg-amber-100',
    Lapsed: 'text-red-700 bg-red-100',
    Cancelled: 'text-slate-600 bg-slate-100',
    Expired: 'text-slate-600 bg-slate-100',
  };
  const cls = map[status] ?? 'text-slate-600 bg-slate-100';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
