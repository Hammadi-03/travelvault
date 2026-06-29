<?php
// ── Database configuration ────────────────────────────────────
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'travelvault');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('DB_CHARSET', 'utf8mb4');

// ── JWT secret (set a strong random string in .env) ──────────
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'change-me-to-a-long-random-secret');
define('JWT_EXPIRY', 60 * 60 * 24 * 7); // 7 days

// ── File storage ──────────────────────────────────────────────
// Absolute path where uploaded files will be stored.
// Make sure this directory is writable by the web server.
define('UPLOAD_DIR', __DIR__ . '/../uploads/');

// Public base URL for uploaded files (no trailing slash)
define('UPLOAD_URL', $_ENV['APP_URL'] ?? 'http://localhost:8000');

// Max upload size in bytes (500 MB)
define('MAX_FILE_SIZE', 500 * 1024 * 1024);

define('ACCEPTED_MIME_TYPES', [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
]);

// ── CORS ──────────────────────────────────────────────────────
define('ALLOWED_ORIGIN', $_ENV['ALLOWED_ORIGIN'] ?? 'http://localhost:5173');
