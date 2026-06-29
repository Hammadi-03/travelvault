<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Method not allowed', 405);

require_auth();

$page     = max(0, (int)($_GET['page'] ?? 0));
$pageSize = 20;
$offset   = $page * $pageSize;
$query    = trim($_GET['q'] ?? '');
$fileType = $_GET['file_type'] ?? 'all';

$db     = DB::get();
$where  = ['1=1'];
$params = [];

if ($query !== '') {
    $where[]  = 'm.file_name LIKE ?';
    $params[] = '%' . $query . '%';
}

if ($fileType === 'image' || $fileType === 'video') {
    $where[]  = 'm.file_type = ?';
    $params[] = $fileType;
}

$whereSQL = implode(' AND ', $where);

// Count
$countStmt = $db->prepare("SELECT COUNT(*) FROM media m WHERE $whereSQL");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

// Data
$dataParams   = array_merge($params, [$pageSize, $offset]);
$stmt         = $db->prepare("
    SELECT
        m.*,
        u.id           AS uploader_id,
        u.display_name AS uploader_display_name,
        u.avatar_url   AS uploader_avatar_url,
        u.email        AS uploader_email
    FROM media m
    JOIN users u ON u.id = m.user_id
    WHERE $whereSQL
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
");
$stmt->execute($dataParams);
$rows = $stmt->fetchAll();

$items = array_map(fn($r) => [
    'id'            => $r['id'],
    'user_id'       => $r['user_id'],
    'file_name'     => $r['file_name'],
    'file_path'     => $r['file_path'],
    'file_type'     => $r['file_type'],
    'mime_type'     => $r['mime_type'],
    'file_size'     => (int)$r['file_size'],
    'width'         => $r['width'] !== null ? (int)$r['width'] : null,
    'height'        => $r['height'] !== null ? (int)$r['height'] : null,
    'duration'      => $r['duration'] !== null ? (float)$r['duration'] : null,
    'public_url'    => $r['public_url'],
    'thumbnail_url' => $r['thumbnail_url'],
    'created_at'    => $r['created_at'],
    'uploader' => [
        'id'           => $r['uploader_id'],
        'display_name' => $r['uploader_display_name'],
        'avatar_url'   => $r['uploader_avatar_url'],
        'email'        => $r['uploader_email'],
    ],
], $rows);

json_response(['total' => $total, 'items' => $items]);
