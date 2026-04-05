import { useEffect, useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE;

function AdPlacement({ slotId, format = 'auto', layout = '' }) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {}
  }, []);

  return (
    <div className="w-full my-6 flex justify-center items-center bg-white/40 backdrop-blur-sm border border-indigo-100 rounded-2xl min-h-[90px] p-2 text-center relative overflow-hidden transition-all hover:bg-white/60">
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <span className="text-xs font-semibold tracking-widest text-indigo-800 uppercase">Advertisement Space</span>
      </div>
      <ins
        className="adsbygoogle relative z-10 w-full"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" 
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { 'data-ad-layout': layout } : {})}
      ></ins>
    </div>
  );
}

function Spinner({ className = "h-5 w-5 text-indigo-600" }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function StatusBadge({ status, error, progress, speed, timeRemaining, isIndeterminate }) {
  if (status === 'idle') return null;

  const map = {
    fetching:    { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'Extracting video link...' },
    downloading: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: isIndeterminate ? 'Downloading...' : 'Downloading directly to your device...' },
    completed:   { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: '✓ Download Complete!' },
    error:       { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: error || 'Something went wrong.' },
  };

  const cfg = map[status] || map.error;
  return (
    <div className={`mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-4 text-sm font-medium transition-all duration-300 shadow-sm ${cfg.bg} ${cfg.text} w-full`}>
      <div className="flex items-center gap-3 w-full justify-center">
        {(status === 'fetching' || status === 'downloading') && <Spinner />}
        <span className="text-center">{cfg.label}</span>
      </div>
      
      {status === 'downloading' && (
        <div className="w-full mt-2 flex flex-col gap-2">
          {isIndeterminate ? (
            <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse w-full"></div>
            </div>
          ) : (
            <>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-blue-600 font-semibold w-full px-1">
                <span>{Math.round(progress)}%</span>
                <div className="flex gap-3">
                    {speed && <span>{speed}</span>}
                    {timeRemaining && <span>{timeRemaining} remaining</span>}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Downloader() {
  const [url, setUrl]       = useState('');
  
  // App Phase: 'input' -> 'info' 
  // status: 'idle' | 'fetching' | 'downloading' | 'completed' | 'error'
  const [phase, setPhase]   = useState('input');
  const [status, setStatus] = useState('idle');
  const [error, setError]   = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  
  // Selection
  const [selectedFormatId, setSelectedFormatId] = useState('');
  
  // Progress
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  const abortRef = useRef(null);
  const busy = status === 'fetching' || status === 'downloading';

  // ── 1. Fetch Info ────────────────────────────────────────────────────────
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
      const endpoint = `${API_BASE}/api/info?url=${encodeURIComponent(trimmed)}`;
      const response = await fetch(endpoint, { signal: controller.signal });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        let errMsg = `Server error ${response.status}`;
        try { errMsg = JSON.parse(bodyText)?.error || errMsg; } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      setVideoInfo(data);
      if (data.formats && data.formats.length > 0) {
        // Pre-select the highest quality video
        const videos = data.formats.filter(f => f.type === 'video');
        if (videos.length > 0) setSelectedFormatId(videos[0].format_id);
        else setSelectedFormatId(data.formats[0].format_id);
      }
      
      setPhase('info');
      setStatus('idle');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to fetch video details.');
      setStatus('error');
    }
  }

  // ── 2. Download Media ───────────────────────────────────────────────────
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
      const formatObj = videoInfo.formats.find(f => f.format_id === selectedFormatId);
      const outputType = formatObj ? formatObj.type : 'video';

      const endpointUrl = new URL(`${API_BASE}/api/stream`);
      endpointUrl.searchParams.append('url', url);
      endpointUrl.searchParams.append('format_id', selectedFormatId);
      endpointUrl.searchParams.append('type', outputType);
      endpointUrl.searchParams.append('title', videoInfo.title);

      const response = await fetch(endpointUrl.toString(), { signal: controller.signal });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        let errMsg = `Server error ${response.status}`;
        try { errMsg = JSON.parse(bodyText)?.error || errMsg; } catch {}
        throw new Error(errMsg);
      }

      const contentLengthStr = response.headers.get('Content-Length');
      // Sometimes length is present but '0' - fallback to indeterminate
      const totalBytes = contentLengthStr ? parseInt(contentLengthStr, 10) : 0;
      setIsIndeterminate(!totalBytes);

      const reader = response.body.getReader();
      let receivedBytes = 0;
      let lastTime = Date.now();
      let lastBytes = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes) {
          setDownloadProgress((receivedBytes / totalBytes) * 100);
        }

        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        if (timeDiff >= 1) {
          const bytesDiff = receivedBytes - lastBytes;
          const speed = bytesDiff / timeDiff; // bytes/sec
          setDownloadSpeed((speed / (1024 * 1024)).toFixed(2) + ' MB/s');

          if (totalBytes) {
            const bytesRemaining = totalBytes - receivedBytes;
            const timeRem = bytesRemaining / speed;
            setTimeRemaining(Math.round(timeRem) + 's');
          }
          lastTime = now;
          lastBytes = receivedBytes;
        }
      }

      const blob = new Blob(chunks, { type: response.headers.get('Content-Type') || 'application/octet-stream' });

      let filename = outputType === 'audio' ? 'audio.mp3' : 'video.mp4';
      const cd = response.headers.get('Content-Disposition');
      if (cd) {
        const rfc5987 = cd.match(/filename\*=UTF-8''([^;]+)/i);
        if (rfc5987) {
          filename = decodeURIComponent(rfc5987[1]);
        } else {
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
      setError(err.message || 'Download failed.');
      setStatus('error');
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.abort();
    setStatus('idle');
    setError(null);
  }

  function resetFlow() {
    setPhase('input');
    setStatus('idle');
    setVideoInfo(null);
    setUrl('');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-200 selection:text-indigo-900 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-indigo-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetFlow}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-800">
              AnyDownloader
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-4xl px-4 mt-6">
          <AdPlacement slotId="TOP_RESPONSIVE_ID" />
        </div>

        <div className="w-full max-w-3xl px-4 py-8 md:py-16 flex flex-col items-center">
          
          {phase === 'input' && (
            <div className="text-center w-full">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                Download Any Video <br className="hidden md:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
                  Instantly
                </span>
              </h1>
              <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                Paste a link from YouTube, Instagram, Facebook, TikTok, Twitter and more.
              </p>

              <div className="w-full bg-white/60 backdrop-blur-xl p-3 md:p-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                <form onSubmit={handleGetInfo} className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      required
                      className="w-full bg-white h-14 pl-6 pr-6 rounded-2xl border-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ring-1 ring-slate-100 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste your video link..."
                      disabled={busy}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-bold hover:bg-indigo-600 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {busy ? <Spinner className="w-5 h-5 text-white" /> : 'Get Video'}
                  </button>
                </form>
                <StatusBadge 
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

          {phase === 'info' && videoInfo && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setPhase('input')} className="mb-6 text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to search
              </button>

              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                {/* Thumbnail Side */}
                <div className="md:w-2/5 md:max-w-xs relative bg-slate-100 flex items-center justify-center">
                  {videoInfo.thumbnail ? (
                     <img src={videoInfo.thumbnail} alt="Thumbnail" className="w-full h-full object-cover aspect-video md:aspect-auto" />
                  ) : (
                     <div className="py-20 text-slate-400 font-medium">No Thumbnail</div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-lg">
                      {videoInfo.platform}
                    </span>
                  </div>
                </div>

                {/* Details & Download Side */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-white relative">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mb-2 line-clamp-3">
                    {videoInfo.title}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mb-8">
                    Select your preferred quality or format below:
                  </p>

                  <form onSubmit={handleDownload} className="flex flex-col gap-4">
                    <select
                      className="w-full h-14 bg-slate-50 px-4 rounded-xl border-none ring-1 ring-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold appearance-none cursor-pointer"
                      value={selectedFormatId}
                      onChange={(e) => setSelectedFormatId(e.target.value)}
                      disabled={busy}
                    >
                      {videoInfo.formats.map((f) => (
                        <option key={f.format_id} value={f.format_id}>
                          {f.type === 'video' ? '📺' : '🎵'} {f.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {busy ? (
                        <button type="button" onClick={handleCancel} className="flex-1 w-full h-14 rounded-xl bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 transition-colors flex items-center justify-center gap-2">
                          Cancel
                        </button>
                      ) : (
                        <button type="submit" className="flex-1 w-full h-14 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                          Download Media
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      )}
                    </div>
                  </form>
                  
                  <StatusBadge 
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
          )}

        </div>

        <div className="w-full max-w-5xl px-4 my-8">
          <AdPlacement slotId="MIDDLE_RESPONSIVE_ID" />
        </div>
      </main>

      <footer className="bg-slate-900 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white tracking-wide">AnyDownloader</span>
          </div>
          <div className="text-slate-400 text-sm">© {new Date().getFullYear()} AnyDownloader. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
