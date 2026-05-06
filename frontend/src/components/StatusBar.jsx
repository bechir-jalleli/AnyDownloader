import Spinner from './Spinner';

export default function StatusBar({ status, error, progress, speed, timeRemaining, isIndeterminate }) {
  if (!status || status === 'idle') return null;

  const isLoading = status === 'fetching' || status === 'downloading';
  const isSuccess = status === 'completed';
  const isError = status === 'error';

  const bgColor = isSuccess ? '#E1F5EE' : isError ? '#FCEBEB' : 'var(--surface-secondary)';
  const bdColor = isSuccess ? '#5DCAA5' : isError ? '#F09595' : 'var(--border-secondary)';
  const txColor = isSuccess ? '#085041' : isError ? '#501313' : 'var(--text-primary)';
  const acColor = isSuccess ? '#0F6E56' : isError ? '#A32D2D' : '#534AB7';

  const label = isSuccess
    ? '✓ Download complete!'
    : isError
      ? error || 'Something went wrong.'
      : status === 'fetching'
        ? 'Fetching video details…'
        : isIndeterminate
          ? 'Downloading…'
          : 'Downloading directly to your device…';

  return (
    <div
      style={{
        marginTop: 12,
        padding: '12px 16px',
        borderRadius: 12,
        border: `0.5px solid ${bdColor}`,
        background: bgColor,
        color: txColor,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
        {isLoading && <Spinner size={14} />}
        <span style={{ color: acColor }}>{label}</span>
      </div>

      {status === 'downloading' && !isIndeterminate && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              height: 4,
              background: 'rgba(0,0,0,0.08)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round(progress)}%`,
                background: '#534AB7',
                borderRadius: 99,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 11,
              color: '#534AB7',
              fontWeight: 500,
            }}
          >
            <span>{Math.round(progress)}%</span>
            <span style={{ display: 'flex', gap: 12 }}>
              {speed && <span>{speed}</span>}
              {timeRemaining && <span>{timeRemaining} left</span>}
            </span>
          </div>
        </div>
      )}

      {status === 'downloading' && isIndeterminate && (
        <div
          style={{
            marginTop: 10,
            height: 4,
            background: 'rgba(0,0,0,0.08)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '100%',
              background: '#534AB7',
              borderRadius: 99,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
