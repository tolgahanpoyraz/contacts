<?php

use Firebase\JWT\JWT;

class ContactController extends Controller
{
    public function __construct(private Contact $contactModel)
    {
    }

    public function getContacts(): void
    {
        $userId = AuthMiddleware::verify();
        $contacts = $this->contactModel->findByUserId($userId, $_GET['q'] ?? null);
        $this->json(200, ['contacts' => $contacts]);
    }

    public function addContact(): void
    {
        $userId = AuthMiddleware::verify();
        $body = $this->readJson();

        if (!$this->requireFields($body, ['firstName', 'lastName', 'phone', 'email'])) {
            return;
        }

        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            $this->json(400, ['error' => 'Invalid email format', 'fields' => ['email']]);
            return;
        }

        $id = $this->contactModel->addContact($userId, $body['firstName'], $body['lastName'], $body['phone'], $body['email']);
        $this->json(201, ['contact' => [
            'id' => $id,
            'firstName' => $body['firstName'],
            'lastName' => $body['lastName'],
            'phone' => $body['phone'],
            'email' => $body['email'],
        ]]);
    }

    public function editContact($id): void
    {
        $userId = AuthMiddleware::verify();
        $body = $this->readJson();
    
        if (!$this->requireFields($body, ['firstName', 'lastName', 'phone', 'email'])) {
            return;
        }

        if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
            $this->json(400, ['error' => 'Invalid email format', 'fields' => ['email']]);
            return;
        }

        $contact = $this->contactModel->findById($id);
        if (!$contact || $contact['user_id'] !== $userId) {
            $this->json(404, ['error' => 'Contact not found']);
            return;
        }

        $this->contactModel->updateContact($id, $body['firstName'], $body['lastName'], $body['phone'], $body['email']);
        $this->json(200, ['contact' => [
            'id' => $id,
            'firstName' => $body['firstName'],
            'lastName' => $body['lastName'],
            'phone' => $body['phone'],
            'email' => $body['email'],
        ]]);
    }

    public function deleteContact($id): void
    {
        $userId = AuthMiddleware::verify();
        $contact = $this->contactModel->findById($id);
        if (!$contact || $contact['user_id'] !== $userId) {
            $this->json(404, ['error' => 'Contact not found']);
            return;
        }

        $this->contactModel->deleteContact($id);
        $this->json(204);
    }
}