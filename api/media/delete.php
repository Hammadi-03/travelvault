<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') json_error('Method not allowed', 405);

$payload = require_auth();
$userId  = $payload['sub'];

// Expect /api/media/delete.php?id=<uuid>
$id = trim($_GET['id'] ?? '');
if (!$id) json_error('Missing media id');

$db   = DB::get();
$stmt = $db->prepare('SELECT * FROM media WHERE id = ?');
$stmt->execute([$id]);
$item = $stmt->fetch();

if (!$item) json_error('Media not found', 404);

// Only owner can delete
if ($item['user_id'] !== $userId) json_error('Forbidden', 403);

// Remove physical file
$absPath = UPLOAD_DIR . $item['file_path'];
if (file_exists($absPath)) {
    unlink($absPath);
}

// Remove DB record
$db->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);

json_response(['message' => 'Deleted']);
