<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Method not allowed', 405);

$payload = require_auth();

$db   = DB::get();
$stmt = $db->prepare('SELECT id, email, display_name, avatar_url, created_at, updated_at FROM users WHERE id = ?');
$stmt->execute([$payload['sub']]);
$user = $stmt->fetch();

if (!$user) json_error('User not found', 404);

json_response($user);
