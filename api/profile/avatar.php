<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$payload = require_auth();
$userId  = $payload['sub'];

if (empty($_FILES['avatar'])) {
    json_error('No avatar file uploaded');
}

$file = $_FILES['avatar'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    json_error('Upload error: ' . $file['error']);
}

if (!in_array($file['type'], ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], true)) {
    json_error('Only image files are accepted for avatars');
}

if ($file['size'] > 5 * 1024 * 1024) {
    json_error('Avatar must be under 5 MB');
}

$ext     = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
$dir     = UPLOAD_DIR . 'avatars/' . $userId . '/';
$relPath = 'avatars/' . $userId . '/avatar.' . $ext;
$absPath = UPLOAD_DIR . $relPath;

if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

if (!move_uploaded_file($file['tmp_name'], $absPath)) {
    json_error('Failed to save avatar', 500);
}

$avatarUrl = UPLOAD_URL . '/uploads/' . $relPath;

// Persist to DB
$now = date('Y-m-d H:i:s');
DB::get()->prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?')
         ->execute([$avatarUrl, $now, $userId]);

json_response(['avatar_url' => $avatarUrl]);
