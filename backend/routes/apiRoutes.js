const express = require('express');
const rateLimit = require('express-rate-limit');

const downloadController = require('../controllers/downloadController');
const { streamDownload } = require('../controllers/streamController');
const { getVideoInfo } = require('../controllers/infoController');

const router = express.Router();

const infoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many info requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const streamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many stream requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Info (Fetch metadata and available qualities) ──
router.get('/info', infoLimiter, getVideoInfo);

// ── Client-side download (streams directly to browser, nothing saved on server) ──
// GET /api/stream?url=<encoded-url>
router.get('/stream', streamLimiter, streamDownload);

// ── Server-side download (legacy – saves to server then client fetches the file) ──
router.post('/download', downloadController.startDownload);
router.get('/download/:downloadId/status', downloadController.getStatus);
router.get('/file/:filename', downloadController.downloadFile);

module.exports = router;

