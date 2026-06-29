<?php
/**
 * In a real app you would send an email here.
 * This endpoint simply acknowledges the request so the frontend
 * can show a "check your email" message without leaking whether
 * the address exists in the database.
 */
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$body  = request_body();
$email = trim($body['email'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('A valid email address is required');
}

// TODO: generate a reset token, store it, and email it to the user.
// For now we just return success so the UI can show the confirmation screen.

json_response(['message' => 'If that address is registered you will receive a reset link shortly.']);
