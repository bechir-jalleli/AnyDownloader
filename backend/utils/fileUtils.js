const fs = require('fs-extra');
const path = require('path');

function getDownloadsRoot() {
  // backend/utils -> backend -> downloads
  return path.resolve(__dirname, '..', 'downloads');
}

function safeResolveDownloadPath({ filename }) {
  if (typeof filename !== 'string' || filename.trim().length === 0) {
    return { ok: false, error: 'filename is required.' };
  }

  const name = filename.trim();

  // Express route param should not contain path separators.
  if (name.includes('/') || name.includes('\\')) {
    return { ok: false, error: 'Invalid filename.' };
  }

  const downloadsRoot = getDownloadsRoot();
  const resolved = path.resolve(downloadsRoot, name);

  // Ensure resolved path stays within the downloads directory.
  const normalizedRoot = downloadsRoot.endsWith(path.sep)
    ? downloadsRoot
    : `${downloadsRoot}${path.sep}`;
  if (!resolved.startsWith(normalizedRoot)) {
    return { ok: false, error: 'Invalid filename.' };
  }

  return { ok: true, resolvedPath: resolved };
}

async function ensureDownloadsDir() {
  await fs.ensureDir(getDownloadsRoot());
}

module.exports = {
  getDownloadsRoot,
  safeResolveDownloadPath,
  ensureDownloadsDir,
};

