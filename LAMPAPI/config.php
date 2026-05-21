<?php

$env = parse_ini_file('/var/www/.env');

if ($env === false) {
    die(json_encode(["error" => "Could not load environment file"]));
}

function getDBConnection()
{
    global $env;

    $conn = new mysqli(
        $env["DB_HOST"],
        $env["DB_USER"],
        $env["DB_PASS"],
        $env["DB_NAME"]
    );

    if ($conn->connect_error) {
        die(json_encode(["error" => $conn->connect_error]));
    }

    return $conn;
}

?>
