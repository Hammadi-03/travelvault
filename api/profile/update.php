<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    json_error('Method not allowed', 405);
}

$payload = require_auth();
$body    = request_body();

$allowed = ['display_name', 'avatar_url'];
$updates = [];
$params  = [];

foreach ($allowed as $field) {
    if (array_key_exists($field, $body)) {
        $updates[] = "$field = ?";
        $params[]  = $body[$field];
    }
}

if (empty($updates)) json_error('No fields to update');

$updates[] = 'updated_at = ?';
$params[]  = date('Y-m-d H:i:s');
$params[]  = $payload['sub'];

$sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
DB::get()->prepare($sql)->execute($params);

$stmt = DB::get()->prepare('SELECT id, email, display_name, avatar_url, created_at, updated_at FROM users WHERE id = ?');
$stmt->execute([$payload['sub']]);
$user = $stmt->fetch();

json_response($user);
