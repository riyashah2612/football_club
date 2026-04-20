<?php
// Suppress any warnings/notices that might corrupt JSON output
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Start output buffering to catch any accidental output
ob_start();

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

require_once __DIR__ . "/db_config.php";
require_once __DIR__ . "/schema.php";

$table = $_GET["table"] ?? "";
$column = $_GET["column"] ?? "";
$value = $_GET["value"] ?? "";

if (!$table || !$column) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Table and column parameters are required.",
    ]);
    exit;
}

if (!validate_table($table)) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid table provided.",
    ]);
    exit;
}

$allowedColumns = validate_columns($table, [$column]);
if (empty($allowedColumns)) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid column provided.",
    ]);
    exit;
}

$likeValue = "%" . $value . "%";
$sql = sprintf("SELECT * FROM `%s` WHERE `%s` LIKE ?", $table, $allowedColumns[0]);
$stmt = mysqli_prepare($conn, $sql);

if (!$stmt) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare statement: " . mysqli_error($conn),
    ]);
    exit;
}

mysqli_stmt_bind_param($stmt, "s", $likeValue);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

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

