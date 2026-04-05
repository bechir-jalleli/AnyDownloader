const { spawn } = require('child_process');
const { validateUrl } = require('../utils/urlUtils');
const fs = require('fs');

function getYtDlpPath() {
  return process.env.YTDLP_PATH || 'yt-dlp';
}

function validateYtDlp() {
  const ytDlpPath = getYtDlpPath();
  if (ytDlpPath === 'yt-dlp') return true; // Assuming global PATH handles it if default
  if (!fs.existsSync(ytDlpPath)) {
    throw new Error('yt-dlp binary not found at configured path.');
  }
  try {
    fs.accessSync(ytDlpPath, fs.constants.X_OK);
  } catch (err) {
    throw new Error('yt-dlp binary is not executable.');
  }
  return true;
}

/**
 * GET /api/stream?url=<encoded-url>
 *
 * Pipes yt-dlp stdout directly to the HTTP response.
 * The browser saves the file locally — nothing is written to the server disk.
 */
async function streamDownload(req, res) {
  req.socket.setTimeout(0); // Prevent Node from dropping long legitimate streams

  console.log('[stream] ── NEW REQUEST ──────────────────────────────');
  console.log('[stream] query params:', req.query);

  const rawUrl = req.query?.url;
  const type = req.query?.type || 'video';
  const quality = req.query?.quality || '720';
  const formatId = req.query?.format_id;
  const passedTitle = req.query?.title;
  
  console.log('[stream] rawUrl:', rawUrl ? rawUrl.slice(0, 80) : '(empty)', '| formatId:', formatId);

  // ── Validate URL ──────────────────────────────────────────────────────────
  const validation = validateUrl(rawUrl);
  if (!validation.ok) {
    console.warn('[stream] URL validation failed:', validation.error);
    return res.status(400).json({ error: validation.error });
  }
  const url = validation.value;
  console.log('[stream] URL validated OK');

  // ── Step 1: Resolve filename ──────────────────────────
  console.log('[stream] STEP 1 — generating filename …');
  let filename = type === 'audio' ? 'audio.mp3' : 'video.mp4';
  try {
    if (passedTitle) {
      const ext = type === 'audio' ? 'mp3' : 'mp4';
      // Sanitize the title broadly for safe OS file names
      const sanTitle = passedTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
      filename = `${sanTitle}.${ext}`;
    } else {
      filename = await getFilename(url, type, quality);
    }
    console.log('[stream] STEP 1 — filename resolved:', filename);
  } catch (err) {
    console.warn('[stream] STEP 1 — getFilename failed (using fallback):', err.message);
  }

  // ── Step 2: Set response headers ─────────────────────────────────────────
  console.log('[stream] STEP 2 — setting response headers …');
  const safeFilenameEncoded = encodeURIComponent(filename);
  
  // HTTP headers must be ASCII. Strip emojis and non-ASCII chars for the fallback filename.
  // The browser will use the UTF-8 encoded filename*= anyway.
  let asciiFilename = filename.replace(/[^\x20-\x7E]/g, '').trim();
  if (!asciiFilename) asciiFilename = 'video.mp4';
  
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFilename}"; filename*=UTF-8''${safeFilenameEncoded}`
  );
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Cache-Control', 'no-store');
  console.log('[stream] STEP 2 — headers set. Content-Disposition:', res.getHeader('Content-Disposition'));

  let formatString = 'best[ext=mp4]/best';
  if (formatId) {
    formatString = formatId;
  } else if (type === 'audio') {
    formatString = 'bestaudio[ext=m4a]/bestaudio/best';
  } else if (quality !== 'best') {
    formatString = `best[ext=mp4][height<=${quality}]/best[height<=${quality}]/best[ext=mp4]/best`;
  }

  const args = [
    '--no-playlist',
    '-f', formatString,
    '-o', '-',   // write to stdout
    url,
  ];
  console.log('[stream] STEP 3 — spawning yt-dlp …');
  console.log('[stream] STEP 3 — args (without url):', args.slice(0, -1));

  const ytDlpPath = getYtDlpPath();
  let child;
  try {
    validateYtDlp();
    child = spawn(ytDlpPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log('[stream] STEP 3 — yt-dlp spawned, pid:', child.pid);
  } catch (spawnErr) {
    console.error('[stream] STEP 3 — spawn threw synchronously:', spawnErr);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to spawn yt-dlp: ' + spawnErr.message });
    }
    return;
  }

  let stderr = '';
  let stdoutBytes = 0;

  child.stderr.on('data', (d) => {
    const chunk = d.toString();
    stderr += chunk;
    // Log stderr lines in real-time so we can see yt-dlp progress / errors
    chunk.split('\n').filter(Boolean).forEach((line) => {
      console.log('[yt-dlp stderr]', line);
    });
  });

  child.stdout.on('data', (chunk) => {
    stdoutBytes += chunk.length;
    if (stdoutBytes <= chunk.length) {
      // Log only the first data event so we know bytes are flowing
      console.log('[stream] STEP 3 — first stdout data received, bytes so far:', stdoutBytes);
    }
  });

  // Pipe yt-dlp stdout → HTTP response
  child.stdout.pipe(res);
  console.log('[stream] STEP 3 — stdout piped to response');

  // Client disconnect → kill yt-dlp
  req.on('close', () => {
    console.log('[stream] client disconnected. stdout bytes sent so far:', stdoutBytes);
    if (!child.killed) {
      child.kill('SIGTERM');
      console.log('[stream] yt-dlp killed due to client disconnect');
    }
  });

  const timeoutTimer = setTimeout(() => {
    console.warn('[stream] yt-dlp exceeded 30 seconds timeout. Killing process.');
    if (!child.killed) {
      child.kill('SIGKILL');
    }
    if (!res.headersSent) {
      res.status(504).json({ error: 'yt-dlp process timed out.' });
    } else {
      res.destroy();
    }
  }, 30000);

  child.on('error', (err) => {
    console.error('[stream] yt-dlp process error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'yt-dlp process error: ' + err.message });
    }
    res.destroy();
  });

  child.on('close', (code) => {
    clearTimeout(timeoutTimer);
    console.log('[stream] ─────────────────────────────────────────────');
    console.log('[stream] yt-dlp exited. code:', code, '| stdout bytes total:', stdoutBytes);
    if (code !== 0) {
      console.error('[stream] yt-dlp FAILED. Last stderr (500 chars):', stderr.slice(-500));
      if (!res.headersSent) {
        return res.status(500).json({
          error: `yt-dlp exited with code ${code}`,
          details: stderr.slice(-2000),
        });
      }
    } else {
      console.log('[stream] yt-dlp SUCCESS');
    }
    console.log('[stream] ─────────────────────────────────────────────');
  });
}

// ── Helper: resolve filename without downloading ──────────────────────────────
function getFilename(url, type, quality) {
  return new Promise((resolve, reject) => {
    let formatString = 'best[ext=mp4]/best';
    if (type === 'audio') {
      formatString = 'bestaudio[ext=m4a]/bestaudio/best';
    } else if (quality !== 'best') {
      formatString = `best[ext=mp4][height<=${quality}]/best[height<=${quality}]/best[ext=mp4]/best`;
    }

    const args = [
      '--no-playlist',
      '-f', formatString,
      '--print', '%(title).200B.%(ext)s',
      url,
    ];

    console.log('[stream/getFilename] spawning yt-dlp --print …');
    const ytDlpPath = getYtDlpPath();
    let child;
    try {
      validateYtDlp();
      child = spawn(ytDlpPath, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      return reject(err);
    }

    let out = '';
    let errOut = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => {
      errOut += d.toString();
      // Dump stderr so we see what yt-dlp says during --print
      d.toString().split('\n').filter(Boolean).forEach((line) => {
        console.log('[yt-dlp --print stderr]', line);
      });
    });

    const timer = setTimeout(() => {
      child.kill();
      console.warn('[stream/getFilename] timed out after 15 s');
      reject(new Error('getFilename timeout'));
    }, 15_000);

    child.on('error', (err) => {
      clearTimeout(timer);
      console.error('[stream/getFilename] spawn error:', err);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      console.log('[stream/getFilename] yt-dlp --print exited. code:', code, '| stdout:', out.trim().slice(0, 100));
      const name = out.trim().split('\n')[0].trim();
      if (code === 0 && name) {
        resolve(name);
      } else {
        console.warn('[stream/getFilename] failed. stderr tail:', errOut.slice(-300));
        reject(new Error(`yt-dlp --print exited ${code}`));
      }
    });
  });
}

module.exports = { streamDownload };
