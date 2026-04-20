<?php
// Suppress errors to prevent output before JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

$host = "localhost";
$user = "root";
$password = "your_password";
$dbname = "football_club";

// First, try to connect to MySQL server (without selecting database)
$conn = mysqli_connect($host, $user, $password);

if (!$conn) {
    // Only output error if not already in output buffer context
    if (!ob_get_level()) {
        ob_start();
    }
    ob_clean();
    http_response_code(500);
    header("Content-Type: application/json");
    $error = mysqli_connect_error();
    echo json_encode([
        "success" => false,
        "message" => "MySQL connection failed: " . $error . ". Please check your username and password.",
    ]);
    exit;
}

// Now try to select the database
if (!mysqli_select_db($conn, $dbname)) {
    // Database doesn't exist or access denied
    if (!ob_get_level()) {
        ob_start();
    }
    ob_clean();
    http_response_code(500);
    header("Content-Type: application/json");
    $error = mysqli_error($conn);
    echo json_encode([
        "success" => false,
        "message" => "Database '$dbname' not found or access denied: " . $error . ". Please create the database or check permissions.",
    ]);
    mysqli_close($conn);
    exit;
}

mysqli_set_charset($conn, "utf8mb4");

