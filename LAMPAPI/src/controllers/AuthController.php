<?php

use Firebase\JWT\JWT;

class AuthController
{
    public function __construct(private User $userModel)
    {
    }

    public function register()
    {
        $body = $this->readJson();

        if (!$this->requireFields($body, ['username', 'password', 'firstName', 'lastName'])) {
            return;
        }

        try {
            $userId = $this->userModel->create($body['username'], $body['password'], $body['firstName'], $body['lastName']);
        } catch (UsernameTakenException) {
            $this->json(409, ['error' => 'Username already taken']);
            return;
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $this->json(500, ['error' => 'Internal server error']);
            return;
        }

        $this->json(201, ['token' => $this->issueToken($userId)]);
    }

    public function login(): void
    {
        $body = $this->readJson();

        if (!$this->requireFields($body, ['username', 'password'])) {
            return;
        }

        $user = $this->userModel->findByUsername($body['username']);

        if (!$user || !password_verify($body['password'], $user['password'])) {
            $this->json(401, ['error' => 'Invalid credentials']);
            return;
        }

        $this->json(200, ['token' => $this->issueToken($user['id'])]);
    }

    private function readJson(): array
    {
        $body = json_decode(file_get_contents('php://input'), true);
        return is_array($body) ? $body : [];
    }

    private function requireFields(array $body, array $fields): bool
    {
        $missing = [];
        foreach ($fields as $field) {
            if (empty($body[$field])) {
                $missing[] = $field;
            }
        }

        if ($missing) {
            $this->json(400, ['error' => 'Missing required fields', 'fields' => $missing]);
            return false;
        }
        return true;
    }

    private function issueToken(int $userId): string
    {
        $payload = ['userId' => $userId, 'exp' => time() + (60 * 60 * 24)];
        return JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
    }

    private function json(int $code, array $data): void
    {
        header('Content-Type: application/json');
        http_response_code($code);
        echo json_encode($data);
    }
}
