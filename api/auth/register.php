<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$body        = request_body();
$email       = trim($body['email'] ?? '');
$password    = $body['password'] ?? '';
$displayName = trim($body['display_name'] ?? '');

if (!$email || !$password || !$displayName) {
    json_error('email, password and display_name are required');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Invalid email address');
}
if (strlen($password) < 8) {
    json_error('Password must be at least 8 characters');
}

$db = DB::get();

// Check for duplicate email
$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_error('Email already registered', 409);
}

$id           = uuid4();
$passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
$now          = date('Y-m-d H:i:s');

$db->prepare('INSERT INTO users (id, email, password_hash, display_name, avatar_url, created_at, updated_at)
              VALUES (?, ?, ?, ?, NULL, ?, ?)')
   ->execute([$id, $email, $passwordHash, $displayName, $now, $now]);

$token = JWT::encode([
    'sub' => $id,
    'email' => $email,
    'iat' => time(),
    'exp' => time() + JWT_EXPIRY,
]);

json_response([
    'token' => $token,
    'user'  => [
        'id'           => $id,
        'email'        => $email,
        'display_name' => $displayName,
        'avatar_url'   => null,
        'created_at'   => $now,
        'updated_at'   => $now,
    ],
], 201);
