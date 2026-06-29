<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$body     = request_body();
$email    = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if (!$email || !$password) {
    json_error('email and password are required');
}

$db   = DB::get();
$stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_error('Invalid email or password', 401);
}

$token = JWT::encode([
    'sub'   => $user['id'],
    'email' => $user['email'],
    'iat'   => time(),
    'exp'   => time() + JWT_EXPIRY,
]);

unset($user['password_hash']);

json_response(['token' => $token, 'user' => $user]);
