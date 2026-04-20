<?php
// Suppress any warnings/notices that might corrupt JSON output
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Start output buffering to catch any accidental output
ob_start();

// Function to send JSON error response
function sendJsonError($message, $code = 500) {
    ob_clean();
    http_response_code($code);
    header("Content-Type: application/json");
    header("Access-Control-Allow-Origin: *");
    echo json_encode([
        "success" => false,
        "message" => $message,
    ]);
    exit;
}

// Allow CORS for local development (Live Server on different port)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Check if required files exist
    $dbConfigPath = __DIR__ . "/db_config.php";
    $schemaPath = __DIR__ . "/schema.php";
    
    if (!file_exists($dbConfigPath)) {
        sendJsonError("Database configuration file not found.", 500);
    }
    
    if (!file_exists($schemaPath)) {
        sendJsonError("Schema file not found.", 500);
    }
    
    require_once $dbConfigPath;
    require_once $schemaPath;
    
    // Check if database connection is available
    if (!isset($conn) || !$conn) {
        sendJsonError("Database connection not available. Check db_config.php", 500);
    }
    
    $table = $_GET["table"] ?? "";
    
    if (!$table || !validate_table($table)) {
        sendJsonError("Invalid or missing table parameter.", 400);
    }
    
    $allowedColumns = get_allowed_tables()[$table];
    if (empty($allowedColumns)) {
        sendJsonError("No columns defined for table: " . $table, 500);
    }
    
    $orderColumn = $allowedColumns[0];
    $query = "SELECT * FROM `$table` ORDER BY `$orderColumn` ASC";
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        $error = mysqli_error($conn);
        sendJsonError("Failed to fetch data: " . $error, 500);
    }
    
    $records = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $records[] = $row;
    }
    
    // Ensure we always return an array, even if empty
    if (!is_array($records)) {
        $records = [];
    }
    
    // Clear any accidental output and send clean JSON
    ob_clean();
    header("Content-Type: application/json");
    header("Access-Control-Allow-Origin: *");
    echo json_encode($records);
    
} catch (Throwable $e) {
    // Catch any PHP errors or exceptions
    sendJsonError("PHP Error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine(), 500);
}

