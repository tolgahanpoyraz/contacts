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

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM Contacts WHERE ID = :id');
        $stmt->execute([':id' => $id]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        return $contact ?: null;
    }

    public function updateContact(int $id, ?string $firstName, ?string $lastName, ?string $phone, ?string $email): void
    {
        $fields = [];
        $params = [':id' => $id];

        if ($firstName !== null) {
            $fields[] = 'FirstName = :firstName';
            $params[':firstName'] = $firstName;
        }
        if ($lastName !== null) {
            $fields[] = 'LastName = :lastName';
            $params[':lastName'] = $lastName;
        }
        if ($phone !== null) {
            $fields[] = 'Phone = :phone';
            $params[':phone'] = $phone;
        }
        if ($email !== null) {
            $fields[] = 'Email = :email';
            $params[':email'] = $email;
        }

        if (empty($fields)) {
            return;
        }

        $sql = 'UPDATE Contacts SET ' . implode(', ', $fields) . ' WHERE ID = :id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
    }

    public function deleteContact(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM Contacts WHERE ID = :id');
        $stmt->execute([':id' => $id]);
    }
}
