# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-05
### Added
- Direct streaming architecture piping `yt-dlp` output to Express response for 0 server storage bloat.
- MERN integration with MongoDB connection startup loop and Express API routing.
- React frontend interface featuring direct quality selector and metadata extraction state logic.
- Full mobile responsiveness updates across components.
- React Error Boundary catching UI rendering crashes robustly.
- Security Headers configuration (Helmet) handling Content Security Policies elegantly.
- Dynamic environment variable configuration with explicit `.env.example`.
- Rate limiting module scaling APIs (`express-rate-limit` on info & stream).
- Input validation sanitization mapping custom error statuses for bad URLs.
- Child process timeout bounds capturing stranded video fetchers safely.
- Explicit CORS whitelisting preventing unauthorized cross-origin streams.
- `yt-dlp` path resolution validator returning 500 cleanly if binary access is denied.
- Fetch API implementation evaluating ReadableStream to deliver accurate bytes received & estimated delivery times in frontend StatusBadge.
- AdSense placement helper component.
