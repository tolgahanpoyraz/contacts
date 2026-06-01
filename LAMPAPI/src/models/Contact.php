<?php

class Contact
{
    public function __construct(private PDO $pdo)
    {

    }

    public function findByUserId(int $userId, ?string $search = null): array
    {
        $sql = 'SELECT ID as id, FirstName as firstName, LastName as lastName, Phone as phone, Email as email ' .
               'FROM Contacts WHERE UserID = :userId';
        $params = [':userId' => $userId];

        if ($search !== null && $search !== '') {
            $sql .= ' AND (FirstName LIKE :search OR LastName LIKE :search OR Email LIKE :search)';
            $params[':search'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY FirstName ASC, LastName ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addContact(int $userId, string $firstName, string $lastName, string $phone, string $email): int
    {
        $stmt = $this->pdo->prepare('INSERT INTO Contacts (UserID, FirstName, LastName, Phone, Email) VALUES (:userId, :firstName, :lastName, :phone, :email)');
        $stmt->execute([':userId' => $userId,
                        ':firstName' => $firstName,
                        ':lastName' => $lastName,
                        ':phone' => $phone,
                        ':email' => $email,
                        ]);
        return (int) $this->pdo->lastInsertId();
    }
}
