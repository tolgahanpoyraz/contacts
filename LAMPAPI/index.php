<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();
$dotenv->required(['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET']);

$host = $_ENV['DB_HOST'];
$name = $_ENV['DB_NAME'];
$user = $_ENV['DB_USER'];
$password = $_ENV['DB_PASSWORD'];

$pdo = new PDO("mysql:host={$host};dbname={$name}", $user, $password);

$userModel = new User($pdo);
$contactModel = new Contact($pdo);

$authController = new AuthController($userModel);

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);


match([$method, $path]) {
    ['GET', '/'] => print('Hello, world!'),
    ['POST', '/register'] => $authController->register(),
    default => http_response_code(404),
};
