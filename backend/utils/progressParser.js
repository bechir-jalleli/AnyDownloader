// Parses yt-dlp "[download] ... at ... ETA ..." progress lines.
// We keep this resilient because yt-dlp output can vary slightly by version.

const progressRegex =
  /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+.*?\bat\s+([^\s]+\/s)\s+ETA\s+([0-9A-Za-z:.\\-]+)\b/;

function parseYtDlpProgressLine(line) {
  if (!line || !line.includes('[download]')) return null;

  const match = line.match(progressRegex);
  if (!match) return null;

  const percentage = Number(match[1]);
  const speed = match[2];
  const eta = match[3];

  if (!Number.isFinite(percentage)) return null;

  return {
    percentage,
    speed,
    eta,
  };
}

module.exports = {
  parseYtDlpProgressLine,
};

