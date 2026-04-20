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

$payload = json_decode(file_get_contents("php://input"), true);

if (!$payload) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON payload.",
    ]);
    exit;
}

$table = $payload["table"] ?? "";
$data = $payload["data"] ?? [];

if (!$table || !is_array($data)) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Table and data are required.",
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

$sanitised = sanitize_input($data);
$allowedColumns = validate_columns($table, array_keys($sanitised));

if ($table === "players") {
    $weightKeys = ["Weight_in_kg", "Weight", "weight", "weight_in_kg"];
    foreach ($weightKeys as $weightKey) {
        if (array_key_exists($weightKey, $sanitised)) {
            $weightValue = (float) $sanitised[$weightKey];
            if ($weightValue < 60) {
                ob_clean();
                http_response_code(422);
                echo json_encode([
                    "success" => false,
                    "message" => "Player is underweight. Minimum required weight is 60 kg.",
                ]);
                exit;
            }
            break;
        }
    }
}

if (empty($allowedColumns)) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "No valid columns provided for insert.",
    ]);
    exit;
}

$placeholders = implode(",", array_fill(0, count($allowedColumns), "?"));
$columnsSql = "`" . implode("`,`", $allowedColumns) . "`";
$sql = sprintf("INSERT INTO `%s` (%s) VALUES (%s)", $table, $columnsSql, $placeholders);
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

$types = str_repeat("s", count($allowedColumns));
$values = [];
foreach ($allowedColumns as $column) {
    $values[] = $sanitised[$column] ?? null;
}

mysqli_stmt_bind_param($stmt, $types, ...$values);
$executed = mysqli_stmt_execute($stmt);

if (!$executed) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to insert data: " . mysqli_stmt_error($stmt),
    ]);
    exit;
}

ob_clean();
echo json_encode([
    "success" => true,
    "message" => "Record inserted successfully.",
    "insert_id" => mysqli_insert_id($conn),
]);

