<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware
{
    public static function verify()
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!str_starts_with($header, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            exit();
        }

        $token = substr($header, 7);

        try {
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
            return $decoded->userId;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            exit();
        }

    }
}
