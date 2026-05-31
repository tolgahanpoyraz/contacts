<?php

class Contact
{
    public function __construct(private PDO $pdo)
    {

    }

    public function findByUserId(int $userId): array
    {
        $stmt = $this->pdo->prepare('SELECT ID as id, FirstName as firstName, LastName as lastName, Phone as phone, Email as email FROM Contacts WHERE UserID = :userId');
        $stmt->execute([':userId' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addContact(int $userId, string $firstName, string $lastName, string $phone, string $email): array|false
    {
        $stmt = $this->pdo->prepare('INSERT INTO Contacts (UserID, FirstName, LastName, Phone, Email) VALUES (:userId, :firstName, :lastName, :phone, :email)');
        $stmt->execute([':userId' => $userId,
                        ':firstName' => $firstName,
                        ':lastName' => $lastName,
                        ':phone' => $phone,
                        ':email' => $email,
                        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
