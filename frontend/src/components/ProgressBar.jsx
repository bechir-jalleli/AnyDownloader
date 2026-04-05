function formatEta(eta) {
  if (!eta || eta === '--:--' || eta === '-') return '-';
  return eta;
}

export default function ProgressBar({ progress }) {
  const percentage = progress?.percentage;

  const hasPct = typeof percentage === 'number' && Number.isFinite(percentage);
  if (!hasPct) return null;

  const pct = Math.max(0, Math.min(100, percentage));

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium text-slate-800">Progress: {pct}%</div>
        <div className="text-slate-600">{progress?.speed || '-'}</div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 text-sm text-slate-600">
        ETA: {formatEta(progress?.eta)}
      </div>
    </div>
  );
}

