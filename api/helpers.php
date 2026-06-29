<?php
function json_response(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400): never {
    json_response(['error' => $message], $status);
}

function request_body(): array {
    $body = file_get_contents('php://input');
    return json_decode($body ?: '{}', true) ?? [];
}

/**
 * Reads the Bearer token from Authorization header and returns the decoded JWT payload.
 * Sends 401 and exits if missing or invalid.
 */
function require_auth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) {
        json_error('Unauthorized', 401);
    }
    $token = substr($header, 7);
    try {
        return JWT::decode($token);
    } catch (RuntimeException $e) {
        json_error('Unauthorized: ' . $e->getMessage(), 401);
    }
}

/**
 * Generates a UUID v4.
 */
function uuid4(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
