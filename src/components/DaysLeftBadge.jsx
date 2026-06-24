export default function DaysLeftBadge({ expiryDate }) {
  if (!expiryDate) return null;
  const ms = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
  const days = Math.ceil((ms - Date.now()) / 86400000);

  if (days < 0) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-700 bg-red-100">Expired</span>;
  const cls = days <= 7 ? 'text-red-700 bg-red-100' : days <= 30 ? 'text-amber-700 bg-amber-100' : 'text-green-700 bg-green-100';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{days}d left</span>;
}
