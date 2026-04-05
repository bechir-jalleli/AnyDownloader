const fs = require('fs-extra');
const { randomUUID } = require('crypto');
const uuidv4 = () => randomUUID();

const ytdlpService = require('../services/ytdlpService');
const { validateUrl, isPlaylistUrl } = require('../utils/urlUtils');
const { safeResolveDownloadPath, ensureDownloadsDir } = require('../utils/fileUtils');

async function startDownload(req, res) {
  try {
    const rawUrl = req.body?.url;
    const zip = req.body?.zip === true || req.body?.zip === 'true';

    const validation = validateUrl(rawUrl);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const url = validation.value;
    const playlist = isPlaylistUrl(url);

    const downloadId = uuidv4();
    await ensureDownloadsDir();

    // Debug logging (avoid logging full URL to keep logs shorter/safe).
    try {
      const u = new URL(url);
      console.log('[download] start', {
        downloadId,
        playlist,
        zip,
        hostname: u.hostname,
        pathname: u.pathname,
      });
    } catch {
      console.log('[download] start', { downloadId, playlist, zip });
    }

    // Fire-and-forget download start; progress will be emitted via Socket.IO.
    ytdlpService
      .startDownload({
        url,
        downloadId,
        isPlaylist: playlist,
        zip,
      })
      .catch((err) => {
        // startDownload should catch and emit its own errors; this is a last-resort guard.
        // eslint-disable-next-line no-console
        console.error('Unexpected download start failure:', err);
      });

    return res.status(202).json({ status: 'started', downloadId });
  } catch (err) {
    console.error('[download] failed to start', err);
    return res.status(500).json({ error: err?.message || 'Failed to start download.' });
  }
}

async function getStatus(req, res) {
  const downloadId = req.params.downloadId;
  if (!downloadId) return res.status(400).json({ error: 'downloadId is required.' });

  const status = ytdlpService.getDownloadStatus(downloadId);
  if (!status) return res.status(404).json({ error: 'Download not found.' });

  return res.json(status);
}

async function downloadFile(req, res) {
  const filename = req.params.filename;

  const resolved = safeResolveDownloadPath({ filename });
  if (!resolved.ok) {
    return res.status(400).json({ error: resolved.error });
  }

  const { resolvedPath } = resolved;

  const exists = await fs.pathExists(resolvedPath);
  if (!exists) return res.status(404).json({ error: 'File not found.' });

  return res.download(resolvedPath, filename, (err) => {
    if (err) {
      // It's possible the client disconnected; avoid failing with a second response.
      // eslint-disable-next-line no-console
      console.error('res.download error:', err);
    }
  });
}

module.exports = {
  startDownload,
  getStatus,
  downloadFile,
};

