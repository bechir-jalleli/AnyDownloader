export default function ProgressBar({ progress }) {
  const percentage = progress?.percentage;
  const hasPct = typeof percentage === 'number' && Number.isFinite(percentage);
  if (!hasPct) return null;

  const pct = Math.round(Math.max(0, Math.min(100, percentage)));

  return (
    <div style={{ marginTop: 24, width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        fontSize: 11, 
        fontWeight: 700, 
        textTransform: 'uppercase', 
        letterSpacing: '0.08em', 
        color: 'var(--purple-600)', 
        marginBottom: 8,
        padding: '0 4px'
      }}>
        <span>Progress: {pct}%</span>
        <div style={{ display: 'flex', gap: 12, opacity: 0.7 }}>
          <span>{progress?.speed || '-'}</span>
          <span>{progress?.eta ? `ETA: ${progress.eta}` : '-'}</span>
        </div>
      </div>

      <div style={{ 
        height: 6, 
        width: '100%', 
        background: 'var(--gray-200)', 
        borderRadius: 99, 
        overflow: 'hidden' 
      }}>
        <div
          style={{ 
            height: '100%', 
            width: `${pct}%`, 
            background: 'var(--purple-600)', 
            borderRadius: 99, 
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        />
      </div>
    </div>
  );
}
