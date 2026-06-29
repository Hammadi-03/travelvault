<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Method not allowed', 405);

require_auth(); // must be logged in

$page     = max(0, (int)($_GET['page'] ?? 0));
$pageSize = 20;
$offset   = $page * $pageSize;

$db = DB::get();

$sql = '
    SELECT
        m.*,
        u.id           AS uploader_id,
        u.display_name AS uploader_display_name,
        u.avatar_url   AS uploader_avatar_url,
        u.email        AS uploader_email
    FROM media m
    JOIN users u ON u.id = m.user_id
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
';

$stmt = $db->prepare($sql);
$stmt->execute([$pageSize, $offset]);
$rows = $stmt->fetchAll();

$items = array_map(fn($r) => format_media_row($r), $rows);

json_response($items);

function format_media_row(array $r): array {
    return [
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
    ];
}
