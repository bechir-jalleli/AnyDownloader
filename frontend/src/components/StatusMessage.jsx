import Spinner from './Spinner';

export default function StatusMessage({ status, error, downloadId, details }) {
  if (!status || status === 'idle') return null;

  const isError = status === 'error' || !!error;
  const isSuccess = status === 'completed';
  const isLoading = status === 'fetching' || status === 'downloading';

  const bgColor = isSuccess ? '#E1F5EE' : isError ? '#FCEBEB' : 'var(--surface-secondary)';
  const bdColor = isSuccess ? '#5DCAA5' : isError ? '#F09595' : 'var(--border-secondary)';
  const txColor = isSuccess ? '#085041' : isError ? '#501313' : 'var(--text-primary)';
  const acColor = isSuccess ? '#0F6E56' : isError ? '#A32D2D' : '#534AB7';

  return (
    <div
      style={{
        marginTop: 24,
        padding: '16px 20px',
        borderRadius: 16,
        border: `0.5px solid ${bdColor}`,
        background: bgColor,
        color: txColor,
        animation: 'fadeUp 0.3s ease both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
        {isLoading && <Spinner size={16} />}
        <span style={{ color: acColor, textTransform: 'capitalize' }}>{status}</span>
      </div>

      {downloadId && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8, display: 'flex', gap: 6 }}>
          <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session ID:</span>
          <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4 }}>{downloadId}</code>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.4)', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.05)', fontSize: 13 }}>
          <span style={{ fontWeight: 700 }}>Error:</span> {error}
        </div>
      )}

      {details && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: 6 }}>Technical Details</div>
          <pre style={{ 
            maxHeight: 200, 
            overflow: 'auto', 
            whiteSpace: 'pre-wrap', 
            borderRadius: 10, 
            background: 'rgba(255,255,255,0.6)', 
            padding: 12, 
            fontSize: 12, 
            fontFamily: 'var(--font-mono)',
            border: '0.5px solid rgba(0,0,0,0.05)'
          }}>
            {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
