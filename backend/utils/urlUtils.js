const allowedSchemes = new Set(['http:', 'https:']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateUrl(rawUrl) {
  if (!isNonEmptyString(rawUrl)) {
    return { ok: false, error: 'URL is required.' };
  }

  const url = rawUrl.trim();
  if (url.length > 2048) {
    return { ok: false, error: 'URL is too long.' };
  }

  // Prevent any control characters / whitespace surprises.
  if (/[\r\n\t]/.test(url)) {
    return { ok: false, error: 'URL contains invalid characters.' };
  }

  // Reject shell-injection characters
  if (/[&;|`$()]/.test(url)) {
    return { ok: false, error: 'URL contains forbidden characters.' };
  }

  let parsed;
  try {
    // If the user pastes "facebook.com/..." without http://, URL() constructor throws.
    // Auto-prepend https:// as a convenience.
    const urlWithSchema = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    parsed = new URL(urlWithSchema);
  } catch {
    return { ok: false, error: 'URL is not valid.' };
  }

  if (!allowedSchemes.has(parsed.protocol)) {
    return { ok: false, error: 'Only http(s) URLs are allowed.' };
  }

  return { ok: true, value: parsed.toString() };
}

function isPlaylistUrl(urlString) {
  try {
    const u = new URL(urlString);
    const list = u.searchParams.get('list');
    if (list && list.trim().length > 0) return true;

    // Common YouTube playlist patterns.
    if (u.pathname.toLowerCase().includes('/playlist')) return true;
    return false;
  } catch {
    return false;
  }
}

module.exports = {
  validateUrl,
  isPlaylistUrl,
};

