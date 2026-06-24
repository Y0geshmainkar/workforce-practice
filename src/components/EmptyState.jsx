export default function EmptyState({ message = 'No data found.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <span className="text-5xl mb-4">📭</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}
