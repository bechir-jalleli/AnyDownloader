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

async function getVideoInfo(req, res) {
  const rawUrl = req.query?.url;
  const validation = validateUrl(rawUrl);
  
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const url = validation.value;
  console.log('[info] Fetching metadata for:', url.slice(0, 80));

  const args = ['-J', '--no-playlist', url];

  const ytDlpPath = getYtDlpPath();
  let child;
  try {
    validateYtDlp();
    child = spawn(ytDlpPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    return res.status(500).json({ error: 'System error spawning yt-dlp: ' + err.message });
  }

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (d) => (stdout += d.toString()));
  child.stderr.on('data', (d) => (stderr += d.toString()));

  child.on('close', (code) => {
    if (code !== 0) {
      console.error('[info] yt-dlp -J failed. stderr tail:', stderr.slice(-500));
      return res.status(500).json({ error: 'Failed to fetch video info. ' + stderr.slice(-200) });
    }

    try {
      const data = JSON.parse(stdout);
      
      const title = data.title || 'Unknown Video';
      const thumbnail = data.thumbnail || null;
      const platform = data.extractor_key || data.extractor || 'Unknown Platform';
      const duration = data.duration || 0;

      // Extract Audio-Only formats
      const rawAudio = (data.formats || []).filter(
        (f) => f.vcodec === 'none' && f.acodec !== 'none'
      );
      
      // Extract Pre-merged Video+Audio formats (since ffmpeg is missing!)
      const rawVideo = (data.formats || []).filter(
        (f) => f.vcodec !== 'none' && f.acodec !== 'none'
      );

      // Process Audio formats
      // Pick the best audio format by sorting bitrate (abr)
      rawAudio.sort((a, b) => (b.abr || 0) - (a.abr || 0));
      const audioFormats = rawAudio.length > 0 ? [{
        format_id: rawAudio[0].format_id,
        label: `Audio (MP3)`,
        type: 'audio',
        quality: 'best'
      }] : [];

      // Process Video formats
      // Remove duplicates by picking the best format per height
      const heightMap = new Map();
      rawVideo.forEach((f) => {
        const height = f.height;
        if (!height) return; // Skip if no height
        if (!heightMap.has(height)) {
          heightMap.set(height, f);
        } else {
          // If already has, keep the one with better higher tbr (bitrate)
          if ((f.tbr || 0) > (heightMap.get(height).tbr || 0)) {
            heightMap.set(height, f);
          }
        }
      });

      // Convert map to array and sort by height descending (1080p -> 720p -> 360p)
      const sortedHeights = Array.from(heightMap.keys()).sort((a, b) => b - a);
      const videoFormats = sortedHeights.map(h => {
        const f = heightMap.get(h);
        return {
          format_id: f.format_id,
          label: `${h}p Video (${f.ext || 'mp4'})`,
          type: 'video',
          quality: h
        };
      });

      // Special fallback if NO pre-merged video exists (can happen on strict DASH streams unmerged)
      // We will add a generic "Best Available Video (No Audio)" to let the user know.
      if (videoFormats.length === 0) {
        const fallback = (data.formats || []).filter(f => f.vcodec !== 'none').sort((a,b) => (b.height||0) - (a.height||0))[0];
        if (fallback) {
          videoFormats.push({
            format_id: fallback.format_id,
            label: `Best Video Only (${fallback.height}p, NO SOUND)`,
            type: 'video',
            quality: fallback.height
          });
        }
      }

      console.log(`[info] Success. Found ${videoFormats.length} video formats, ${audioFormats.length} audio.`);

      res.json({
        title,
        thumbnail,
        platform,
        duration,
        formats: [...videoFormats, ...audioFormats],
      });

    } catch (e) {
      console.error('[info] JSON parse error:', e);
      res.status(500).json({ error: 'Invalid response from yt-dlp.' });
    }
  });

  child.on('error', (err) => {
    console.error('[info] yt-dlp spawn error:', err);
    res.status(500).json({ error: 'System error spawning yt-dlp' });
  });
}

module.exports = { getVideoInfo };
