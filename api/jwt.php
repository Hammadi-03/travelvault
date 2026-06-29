<?php
/**
 * Minimal HS256 JWT implementation (no external dependencies).
 */
class JWT {
    public static function encode(array $payload): string {
        $header  = self::base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::base64url(json_encode($payload));
        $sig     = self::base64url(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );
        return "$header.$payload.$sig";
    }

    /**
     * @throws RuntimeException on invalid or expired token
     */
    public static function decode(string $token): array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new RuntimeException('Invalid token format');
        }
        [$header, $payload, $sig] = $parts;
        $expected = self::base64url(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );
        if (!hash_equals($expected, $sig)) {
            throw new RuntimeException('Invalid token signature');
        }
        $data = json_decode(self::base64urlDecode($payload), true);
        if (!$data) {
            throw new RuntimeException('Invalid token payload');
        }
        if (isset($data['exp']) && $data['exp'] < time()) {
            throw new RuntimeException('Token expired');
        }
        return $data;
    }

    private static function base64url(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64urlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
}
