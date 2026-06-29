<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$payload = require_auth();
$userId  = $payload['sub'];

if (empty($_FILES['file'])) {
    json_error('No file uploaded');
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    json_error('Upload error code: ' . $file['error']);
}

if (!in_array($file['type'], ACCEPTED_MIME_TYPES, true)) {
    json_error('Unsupported file type: ' . $file['type']);
}

if ($file['size'] > MAX_FILE_SIZE) {
    json_error('File too large (max 500 MB)');
}

// Determine file type category
$isImage    = str_starts_with($file['type'], 'image/');
$fileType   = $isImage ? 'image' : 'video';

// Build storage path: uploads/{userId}/{timestamp}-{random}.{ext}
$ext        = pathinfo($file['name'], PATHINFO_EXTENSION) ?: ($isImage ? 'jpg' : 'mp4');
$timestamp  = time();
$rand       = bin2hex(random_bytes(5));
$relPath    = $userId . '/' . $timestamp . '-' . $rand . '.' . $ext;
$absPath    = UPLOAD_DIR . $relPath;
$dir        = dirname($absPath);

if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

if (!move_uploaded_file($file['tmp_name'], $absPath)) {
    json_error('Failed to save file', 500);
}

$publicUrl    = UPLOAD_URL . '/uploads/' . $relPath;
$thumbnailUrl = $isImage ? $publicUrl : null;

// Additional metadata from POST fields (sent by the frontend)
$width    = isset($_POST['width'])    ? (int)$_POST['width']    : null;
$height   = isset($_POST['height'])   ? (int)$_POST['height']   : null;
$duration = isset($_POST['duration']) ? (float)$_POST['duration'] : null;

$id  = uuid4();
$now = date('Y-m-d H:i:s');

DB::get()->prepare('
    INSERT INTO media
        (id, user_id, file_name, file_path, file_type, mime_type, file_size, width, height, duration, public_url, thumbnail_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
')->execute([
    $id, $userId, $file['name'], $relPath, $fileType,
    $file['type'], $file['size'], $width, $height, $duration,
    $publicUrl, $thumbnailUrl, $now,
]);

json_response([
    'id'            => $id,
    'user_id'       => $userId,
    'file_name'     => $file['name'],
    'file_path'     => $relPath,
    'file_type'     => $fileType,
    'mime_type'     => $file['type'],
    'file_size'     => $file['size'],
    'width'         => $width,
    'height'        => $height,
    'duration'      => $duration,
    'public_url'    => $publicUrl,
    'thumbnail_url' => $thumbnailUrl,
    'created_at'    => $now,
], 201);
