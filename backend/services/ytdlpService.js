const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

function getYtDlpPath() {
  return process.env.YTDLP_PATH || 'yt-dlp';
}

function validateYtDlp() {
  const ytDlpPath = getYtDlpPath();
  if (ytDlpPath === 'yt-dlp') return true;
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

const { parseYtDlpProgressLine } = require('../utils/progressParser');
const { getDownloadsRoot } = require('../utils/fileUtils');

const downloadEvents = new EventEmitter();

// socket.io instance (optional). When present we broadcast to a room named by `downloadId`.
let ioInstance = null;

// In-memory download registry for REST fallback.
// NOTE: Not persisted; suitable for a dev environment / single instance.
const registry = new Map();

function tail(str, maxLen) {
  if (!str) return '';
  const s = String(str);
  if (s.length <= maxLen) return s;
  return s.slice(-maxLen);
}

function setSocketIO(io) {
  ioInstance = io;
}

function getDownloadStatus(downloadId) {
  return registry.get(downloadId);
}

function emitAndBroadcast(downloadId, event, payload) {
  const data = { downloadId, ...(payload || {}) };
  downloadEvents.emit(event, data);
  if (ioInstance) {
    ioInstance.to(downloadId).emit(event, data);
  }
}

function getOutputTemplate(downloadId) {
  // Prefix with downloadId for uniqueness across concurrent downloads.
  // yt-dlp templates generate only filenames (no path traversal).
  const downloadsRoot = getDownloadsRoot();
  const template = path.join(downloadsRoot, `${downloadId}-%(title).200B_%(id)s.%(ext)s`);
  // yt-dlp handles forward slashes well on Windows.
  return template.replace(/\\/g, '/');
}

async function zipPlaylistFilesIfRequested({ downloadId, fileNames }) {
  // Optional: zip the downloaded files for playlist convenience.
  // No extra dependencies; uses PowerShell's Compress-Archive on Windows.
  if (!Array.isArray(fileNames) || fileNames.length === 0) return null;

  const downloadsRoot = getDownloadsRoot();
  const zipFileName = `${downloadId}.zip`;
  const zipPath = path.join(downloadsRoot, zipFileName);

  const fullPaths = fileNames.map((f) => path.join(downloadsRoot, f));
  const psEscapedPaths = fullPaths
    .map((p) => `'${p.replace(/'/g, "''")}'`)
    .join(',');

  const destinationEscaped = zipPath.replace(/'/g, "''");
  const psCommand = `Compress-Archive -Path @(${psEscapedPaths}) -DestinationPath '${destinationEscaped}' -Force`;

  return new Promise((resolve, reject) => {
    const zipProc = spawn('powershell', ['-NoProfile', '-Command', psCommand], {
      windowsHide: true,
    });

    let stderr = '';
    zipProc.stderr.on('data', (d) => (stderr += d.toString()));

    zipProc.on('close', (code) => {
      if (code === 0) resolve(zipFileName);
      else reject(new Error(`Zip failed (code ${code}): ${stderr.slice(-500)}`));
    });
    zipProc.on('error', reject);
  });
}

async function startDownload({ url, downloadId, isPlaylist, zip }) {
  const downloadsRoot = getDownloadsRoot();
  await fs.ensureDir(downloadsRoot);

  // Create initial registry entry.
  registry.set(downloadId, {
    downloadId,
    url,
    status: 'started',
    progress: null,
    files: [],
    zipFile: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPlaylist: Boolean(isPlaylist),
  });

  emitAndBroadcast(downloadId, 'start', { status: 'started' });

  const outputTemplate = getOutputTemplate(downloadId);

  const args = [
    '--newline',
    '--restrict-filenames',
    '-o',
    outputTemplate,
  ];

  if (isPlaylist) args.push('--yes-playlist');
  else args.push('--no-playlist');

  console.log('[ytdlp] spawn', {
    downloadId,
    isPlaylist: Boolean(isPlaylist),
    zip: Boolean(zip),
    args,
  });

  const ytDlpPath = getYtDlpPath();
  let child;
  try {
    validateYtDlp();
    child = spawn(ytDlpPath, [...args, url], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    // If validation fails, emulate child error
    setTimeout(() => downloadEvents.emit('error', { downloadId, message: err.message }), 0);
    return { downloadId, status: 'error', error: err.message };
  }

  const files = new Set();
  let buffer = '';
  let lastErrorOutput = '';
  let resolvedExitCode = null;
  let progressLogCount = 0;

  function processLine(line) {
    const trimmed = String(line || '').trim();
    if (!trimmed) return;

    // Capture saved filenames for download links.
    // yt-dlp typically prints: "Destination: C:\...\file.ext"
    if (trimmed.includes('Destination:')) {
      const m = trimmed.match(/Destination:\s+(.+)$/);
      if (m && m[1]) {
        const savedPath = m[1].trim();
        const base = path.basename(savedPath);
        if (base) files.add(base);
      }
    }

    const progress = parseYtDlpProgressLine(trimmed);
    if (progress) {
      const current = registry.get(downloadId);
      if (!current) return;
      current.status = 'downloading';
      current.progress = progress;
      current.updatedAt = new Date().toISOString();
      registry.set(downloadId, current);
      emitAndBroadcast(downloadId, 'progress', progress);

      if (progressLogCount < 3 || progress.percentage >= 99) {
        progressLogCount += 1;
        console.log('[ytdlp] progress', { downloadId, ...progress });
      }
    }
  }

  function handleChunk(chunk) {
    const text = chunk.toString();
    buffer += text;
    // yt-dlp may use carriage returns for progress; split both.
    const parts = buffer.split(/\r?\n|\r/);
    buffer = parts.pop() || '';
    for (const p of parts) processLine(p);
  }

  child.stdout.on('data', handleChunk);
  child.stderr.on('data', (d) => {
    lastErrorOutput += d.toString();
    handleChunk(d);
  });

  return await new Promise((resolve) => {
    child.on('error', (err) => {
      const current = registry.get(downloadId) || {};
      resolvedExitCode = 1;
      current.status = 'error';
      current.error = err?.message || String(err);
      current.updatedAt = new Date().toISOString();
      current.files = Array.from(files);
      registry.set(downloadId, current);
      const details = {
        type: 'spawn_error',
        message: err?.message,
        code: err?.code,
        stack: err?.stack,
        lastStderrTail: tail(lastErrorOutput, 4000),
      };
      emitAndBroadcast(downloadId, 'error', { message: current.error, details });
      resolve(current);
    });

    child.on('close', async (code) => {
      resolvedExitCode = code;
      const current = registry.get(downloadId);
      if (!current) {
        resolve({ downloadId, status: 'error', error: 'Missing registry entry.' });
        return;
      }

      const finalFiles = Array.from(files);
      current.files = finalFiles;
      current.updatedAt = new Date().toISOString();

      if (code === 0) {
        current.status = 'finished';
        current.error = null;

        // Optional zip only when requested and when playlist is detected.
        if (zip && isPlaylist) {
          try {
            const zipFile = await zipPlaylistFilesIfRequested({
              downloadId,
              fileNames: finalFiles,
            });
            current.zipFile = zipFile;
          } catch (e) {
            // Don't fail the download if zip fails; still return files.
            current.zipFile = null;
            current.error = `Download finished but zip failed: ${e.message}`;
          }
        }

        registry.set(downloadId, current);
        emitAndBroadcast(downloadId, 'finished', {
          status: 'finished',
          files: current.files,
          zipFile: current.zipFile,
          downloadUrlBase: '/api/file/',
        });
        resolve(current);
      } else {
        current.status = 'error';
        const errTail = tail(lastErrorOutput?.trim(), 4000);
        current.error = errTail || `yt-dlp exited with code ${code}`;
        registry.set(downloadId, current);
        console.error('[ytdlp] exited non-zero', {
          downloadId,
          exitCode: code,
          lastStderrTail: errTail,
        });
        emitAndBroadcast(downloadId, 'error', {
          message: current.error,
          details: {
            type: 'yt_dlp_exit',
            exitCode: code,
            lastStderrTail: errTail,
          },
        });
        resolve(current);
      }
    });
  });
}

module.exports = {
  // Kept for future flexibility; downloadId is generated by controller.
  uuidv4,
  setSocketIO,
  startDownload,
  getDownloadStatus,
  downloadEvents,
};

