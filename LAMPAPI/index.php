<?php

require_once __DIR__ . '/vendor/autoload.php';

require_once __DIR__ . '/src/models/User.php';
require_once __DIR__ . '/src/models/Contact.php';

require_once __DIR__ . '/src/middleware/AuthMiddleware.php';

require_once __DIR__ . '/src/controllers/Controller.php';
require_once __DIR__ . '/src/controllers/AuthController.php';
require_once __DIR__ . '/src/controllers/ContactController.php';

use FastRoute\RouteCollector;

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
$contactController = new ContactController($contactModel);

$dispatcher = FastRoute\simpleDispatcher(function(RouteCollector $routes) use ($contactController, $authController) {
    $routes->post('/register', fn() => $authController->register());
    $routes->post('/login', fn() => $authController->login());
    $routes->get('/contacts', fn() => $contactController->getContacts());
    $routes->post('/contacts', fn() => $contactController->addContact());
    $routes->patch('/contacts/{id:\d+}', fn($vars) => $contactController->editContact((int) $vars['id']));
    $routes->delete('/contacts/{id:\d+}', fn($vars) => $contactController->deleteContact((int) $vars['id']));
});

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $path); # Strip the /api prefix from the url

$routeInfo = $dispatcher->dispatch($method, $path);

header('Content-Type: application/json');

try {
    switch($routeInfo[0]) {
        case FastRoute\Dispatcher::NOT_FOUND:
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            break;

        case FastRoute\Dispatcher::METHOD_NOT_ALLOWED:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;

        case FastRoute\Dispatcher::FOUND:
            $handler = $routeInfo[1];
            $vars = $routeInfo[2];
            $handler($vars);
            break;
    }
} catch (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
