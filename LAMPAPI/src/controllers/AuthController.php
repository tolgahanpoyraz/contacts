<?php

use Firebase\JWT\JWT;

class AuthController
{
    public function __construct(private User $userModel)
    {
    }

    public function register()
    {
        header('Content-Type: application/json');

        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body)) {
            $body = [];
        }

        $missing = [];
        foreach (['username', 'password', 'firstName', 'lastName'] as $field) {
            if (empty($body[$field])) {
                array_push($missing, $field);
            }
        }

        if ($missing) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Missing required fields',
                'fields' => $missing,
            ]);
            return;
        }

        $username = $body['username'];
        $password = $body['password'];
        $firstName = $body['firstName'];
        $lastName = $body['lastName'];

        try {
            $userId = $this->userModel->create($username, $password, $firstName, $lastName);
        } catch (UsernameTakenException) {
            http_response_code(409);
            echo json_encode([
                'error' => 'Username already taken',
            ]);
            return;
        } catch (Throwable $e) {
            error_log($e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Internal server error']);
            return;
        }

        $payload = [
            'userId' => $userId,
            'exp' => time() + (60 * 60 * 24)
        ];

        $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
        http_response_code(201);
        echo json_encode(['token' => $token]);
    }
}
