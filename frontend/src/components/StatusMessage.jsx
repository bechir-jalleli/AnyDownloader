export default function StatusMessage({ status, error, downloadId, details }) {
  if (!status || status === 'idle') return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <div className="font-medium text-slate-800">Status: {status}</div>
      {downloadId ? <div className="mt-1 text-slate-600">ID: {downloadId}</div> : null}
      {error ? <div className="mt-2 text-red-600">Error: {error}</div> : null}
      {details ? (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">
          {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

