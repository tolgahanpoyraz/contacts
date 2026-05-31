<?php

class User
{
    public function __construct(private PDO $pdo)
    {

    }

    public function findByUsername(string $username): array|false
    {
        $stmt = $this->pdo->prepare('SELECT ID as id, Login as login, Password as password FROM Users WHERE Login = :username');
        $stmt->execute([':username' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(string $username, string $password, string $firstName, string $lastName): int
    {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->pdo->prepare('INSERT INTO Users (Login, Password, FirstName, LastName) VALUES (:username, :password, :firstName, :lastName)');

        try {
            $stmt->execute([':username' => $username, ':password' => $hash, ':firstName' => $firstName, ':lastName' => $lastName]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                throw new UsernameTakenException($username);
            }
            throw $e;
        }
        return (int) $this->pdo->lastInsertId();
    }
}

class UsernameTakenException extends Exception
{
}
