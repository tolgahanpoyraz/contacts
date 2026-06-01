<?php

abstract class Controller
{
    protected function readJson(): array
    {
        $body = json_decode(file_get_contents('php://input'), true);
        return is_array($body) ? $body : [];
    }

    protected function requireFields(array $body, array $fields): bool
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

    protected function json(int $code, array $data): void
    {
        header('Content-Type: application/json');
        http_response_code($code);
        echo json_encode($data);
    }
}