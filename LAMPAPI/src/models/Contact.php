<?php

class Contact
{
    public function __construct(private PDO $pdo)
    {

    }

    public function findByUserId(int $userId, ?string $search = null, int $limit = 10, int $offset = 0): array
    {
        $sql = 'SELECT ID as id, FirstName as firstName, LastName as lastName, Phone as phone, Email as email ' .
               'FROM Contacts WHERE UserID = :userId';
        if ($search !== null && $search !== '') {
            $sql .= ' AND (FirstName LIKE :search OR LastName LIKE :search OR Email LIKE :search OR Phone LIKE :search OR CONCAT(FirstName, \' \', LastName) LIKE :search)';
        }
        $sql .= ' ORDER BY FirstName ASC, LastName ASC';
        $sql .= ' LIMIT :limit OFFSET :offset';
    
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':userId', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        if ($search !== null && $search !== '') {
            $stmt->bindValue(':search', '%' . $search . '%');
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countByUserId(int $userId, ?string $search = null): int
    {
        $sql = 'SELECT COUNT(*) FROM Contacts WHERE UserID = :userId';
        $params = [':userId' => $userId];
        if ($search !== null && $search !== '') {
            $sql .= ' AND (FirstName LIKE :search OR LastName LIKE :search OR Email LIKE :search OR Phone LIKE :search OR CONCAT(FirstName, \' \', LastName) LIKE :search)';
            $params[':search'] = '%' . $search . '%';
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
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

    public function findByContactId(int $id): array|false
    {
        $stmt = $this->pdo->prepare('SELECT ID as id, FirstName as firstName, LastName as lastName, Phone as phone, Email as email, UserID as userId FROM Contacts WHERE ID = :id');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateContact(int $id, string $firstName, string $lastName, string $phone, string $email): void
    {
        $stmt = $this->pdo->prepare('UPDATE Contacts SET FirstName = :firstName, LastName = :lastName, Phone = :phone, Email = :email WHERE ID = :id');
        $stmt->execute([
            ':id' => $id,
            ':firstName' => $firstName,
            ':lastName' => $lastName,
            ':phone' => $phone,
            ':email' => $email,
        ]);
    }

    public function deleteContact(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM Contacts WHERE ID = :id');
        $stmt->execute([':id' => $id]);
    }
}
