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



}