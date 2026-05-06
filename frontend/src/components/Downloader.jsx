import { useEffect, useRef, useState } from 'react';
import Spinner from './Spinner';
import StatusBar from './StatusBar';
import AdPlacement from './AdPlacement';
import { useTranslation } from 'react-i18next';

const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '');

export default function Downloader() {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState('input');   // 'input' | 'info'
  const [status, setStatus] = useState('idle');     // 'idle' | 'fetching' | 'downloading' | 'completed' | 'error'
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  const abortRef = useRef(null);
  const busy = status === 'fetching' || status === 'downloading';

  // ── Fetch Info ──────────────────────────────────────────────────────────────
  async function handleGetInfo(e) {
    if (e) e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('fetching');
    setError(null);
    setPhase('input');
    setVideoInfo(null);

    try {
      const res = await fetch(`${API_BASE}/api/info?url=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = `Server error ${res.status}`;
        try { msg = JSON.parse(text)?.error || msg; } catch { }
        throw new Error(msg);
      }

      const data = await res.json();
      setVideoInfo(data);

      if (data.formats?.length > 0) {
        const videos = data.formats.filter(f => f.type === 'video');
        setSelectedFormatId(videos.length > 0 ? videos[0].format_id : data.formats[0].format_id);
      }

      setPhase('info');
      setStatus('idle');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || t('downloader.status.error'));
      setStatus('error');
    }
  }

  // ── Download ────────────────────────────────────────────────────────────────
  async function handleDownload(e) {
    if (e) e.preventDefault();
    if (!videoInfo || !selectedFormatId) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('downloading');
    setError(null);
    setDownloadProgress(0);
    setDownloadSpeed('');
    setTimeRemaining('');
    setIsIndeterminate(false);

    try {
      const formatObj = videoInfo.formats?.find(f => f.format_id === selectedFormatId);
      const outputType = formatObj?.type || 'video';

      const endpoint = new URL(`${API_BASE}/api/stream`);
      endpoint.searchParams.append('url', url);
      endpoint.searchParams.append('format_id', selectedFormatId);
      endpoint.searchParams.append('type', outputType);
      endpoint.searchParams.append('title', videoInfo.title);

      const res = await fetch(endpoint.toString(), { signal: controller.signal });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = `Server error ${res.status}`;
        try { msg = JSON.parse(text)?.error || msg; } catch { }
        throw new Error(msg);
      }

      const totalBytes = parseInt(res.headers.get('Content-Length') || '0', 10);
      setIsIndeterminate(!totalBytes);

      const reader = res.body.getReader();
      const chunks = [];
      let receivedBytes = 0;
      let lastTime = Date.now();
      let lastBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes) setDownloadProgress((receivedBytes / totalBytes) * 100);

        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        if (dt >= 1) {
          const spd = (receivedBytes - lastBytes) / dt;
          setDownloadSpeed((spd / (1024 * 1024)).toFixed(2) + ' MB/s');
          if (totalBytes) setTimeRemaining(Math.round((totalBytes - receivedBytes) / spd) + 's');
          lastTime = now;
          lastBytes = receivedBytes;
        }
      }

      const blob = new Blob(chunks, {
        type: res.headers.get('Content-Type') || 'application/octet-stream',
      });

      let filename = outputType === 'audio' ? 'audio.mp3' : 'video.mp4';
      const cd = res.headers.get('Content-Disposition');
      if (cd) {
        const rfc = cd.match(/filename\*=UTF-8''([^;]+)/i);
        if (rfc) filename = decodeURIComponent(rfc[1]);
        else {
          const plain = cd.match(/filename="?([^";\r\n]+)"?/i);
          if (plain) filename = plain[1].trim();
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      setStatus('completed');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || t('downloader.status.error'));
      setStatus('error');
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.abort();
    setStatus('idle');
    setError(null);
  }

  const PLATFORMS = [
    {
      name: 'YouTube', icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" /></svg>
      )
    },
    {
      name: 'TikTok', icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.83 1.56V6.8a4.84 4.84 0 0 1-1.06-.11z" /></svg>
      )
    },
    {
      name: 'Instagram', icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4.5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
      )
    },
    {
      name: 'Facebook', icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg>
      )
    },
  ];

  return (
    <div className="container">
      <AdPlacement slotId="TOP_RESPONSIVE_ID" />

      {/* ── INPUT PHASE ── */}
      {phase === 'input' && (
        <div className="flex flex-col items-center py-16">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] tracking-tight mb-6">
              {t('downloader.title').split(' ')[0]} <span className="text-indigo-600 dark:text-indigo-400">{t('downloader.title').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              {t('downloader.subtitle')}
            </p>
          </div>

          {/* Search Card */}
          <div className="w-full max-w-3xl bg-[var(--surface-primary)] p-2 rounded-[32px] border border-[var(--border-tertiary)] shadow-2xl shadow-indigo-500/5 transition-all duration-500 hover:border-indigo-200 dark:hover:border-indigo-800/50 mb-12">
            <form onSubmit={handleGetInfo} className="flex items-center gap-2 p-1.5">
              <div className="flex-1 relative flex items-center">
                <div className="absolute left-5 text-[var(--text-tertiary)]">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
                <input
                  type="url"
                  required
                  className="w-full h-14 pl-14 pr-32 bg-[var(--surface-secondary)] border-transparent rounded-[24px] text-[var(--text-primary)] font-medium placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-indigo-500/20 focus:bg-[var(--surface-primary)] focus:border-indigo-500/50 transition-all outline-none"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder={t('downloader.inputPlaceholder')}
                  disabled={busy}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="absolute right-3 px-4 py-2 rounded-xl bg-[var(--surface-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xs font-bold uppercase tracking-wider"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setUrl(text);
                    } catch { }
                  }}
                >
                  {i18n.language === 'ar' ? 'لصق' : 'Paste'}
                </button>
              </div>

              <button 
                type="submit" 
                className="h-14 px-8 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                disabled={busy}
              >
                {busy ? (
                  <Spinner size={20} />
                ) : (
                  <>
                    <span className="hidden sm:inline">{t('downloader.btnFetch')}</span>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Platform List */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 opacity-60 hover:opacity-100 transition-opacity duration-500">
            {PLATFORMS.map(p => (
              <div key={p.name} className="flex items-center gap-2.5 text-[var(--text-tertiary)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-default grayscale hover:grayscale-0">
                {p.icon}
                <span className="text-sm font-semibold tracking-wide uppercase">{p.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 w-full max-w-xl">
            <StatusBar
              status={status}
              error={error}
              progress={downloadProgress}
              speed={downloadSpeed}
              timeRemaining={timeRemaining}
              isIndeterminate={isIndeterminate}
            />
          </div>
        </div>
      )}

      {/* ── INFO PHASE ── */}
      {phase === 'info' && videoInfo && (
        <div className="flex flex-col items-center py-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <button className="flex items-center gap-2 mb-10 px-4 py-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-all font-bold text-xs uppercase tracking-widest" onClick={() => { setPhase('input'); setStatus('idle'); }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('downloader.btnReset')}
          </button>

          <div className="w-full max-w-4xl bg-[var(--surface-primary)] rounded-[40px] border border-[var(--border-tertiary)] shadow-2xl overflow-hidden flex flex-col md:flex-row">
            {/* Thumbnail */}
            <div className="md:w-[40%] relative aspect-video md:aspect-auto">
              {videoInfo.thumbnail ? (
                <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--surface-tertiary)]" />
              )}
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-widest border border-white/10">
                {videoInfo.platform}
              </div>
            </div>
            
            <div className="flex-1 p-8 md:p-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-4">{videoInfo.title}</h2>
              <div className="flex items-center gap-3 mb-8">
                {videoInfo.author && <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{videoInfo.author}</span>}
                <div className="w-1 h-1 rounded-full bg-[var(--border-tertiary)]" />
                {videoInfo.duration && <span className="text-xs font-bold text-[var(--text-tertiary)]">{videoInfo.duration}</span>}
              </div>

              <div className="mb-10">
                <label className="block text-[10px] uppercase font-black text-[var(--text-tertiary)] tracking-[0.2em] mb-4">{t('downloader.format')}</label>
                <div className="flex flex-wrap gap-2">
                  {videoInfo.formats?.map(f => (
                    <button
                      key={f.format_id}
                      className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                        selectedFormatId === f.format_id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
                        : 'bg-[var(--surface-secondary)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                      }`}
                      onClick={() => setSelectedFormatId(f.format_id)}
                      disabled={busy}
                    >
                      <div className="flex items-center gap-2">
                        <span>{f.quality}</span>
                        <span className="opacity-50 text-[10px]">{f.ext}</span>
                        {f.filesize_str && <span className="ml-1 opacity-80">{f.filesize_str}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {busy ? (
                  <button type="button" className="w-full h-16 rounded-[20px] bg-red-500/10 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all" onClick={handleCancel}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                ) : (
                  <button type="button" className="w-full h-16 rounded-[20px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all" onClick={handleDownload}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('downloader.download')}
                  </button>
                )}

                <StatusBar
                  status={status}
                  error={error}
                  progress={downloadProgress}
                  speed={downloadSpeed}
                  timeRemaining={timeRemaining}
                  isIndeterminate={isIndeterminate}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <AdPlacement slotId="BOTTOM_RESPONSIVE_ID" />
    </div>
  );
}