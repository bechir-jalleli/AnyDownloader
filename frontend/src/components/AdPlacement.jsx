import { useEffect } from 'react';

export default function AdPlacement({ slotId, format = 'auto', layout = '' }) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch { }
  }, []);

  return (
    <div
      style={{
        width: '100%',
        margin: '24px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 90,
        border: '0.5px solid var(--border-tertiary)',
        borderRadius: 12,
        background: 'var(--surface-secondary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 6,
          left: 12,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
        }}
      >
        Sponsored
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { 'data-ad-layout': layout } : {})}
      />
    </div>
  );
}
