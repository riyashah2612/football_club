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

$allowedColumns = get_allowed_tables()[$table];
$primaryKey = $allowedColumns[0];

if (!isset($data[$primaryKey])) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => sprintf("Primary key '%s' is required for update.", $primaryKey),
    ]);
    exit;
}

$sanitised = sanitize_input($data);
$primaryValue = $sanitised[$primaryKey];
unset($sanitised[$primaryKey]);

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

$updateColumns = validate_columns($table, array_keys($sanitised));

if (empty($updateColumns)) {
    ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "No valid columns provided for update.",
    ]);
    exit;
}

$setParts = [];
foreach ($updateColumns as $column) {
    $setParts[] = sprintf("`%s` = ?", $column);
}

$sql = sprintf(
    "UPDATE `%s` SET %s WHERE `%s` = ?",
    $table,
    implode(", ", $setParts),
    $primaryKey
);

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

$types = str_repeat("s", count($updateColumns)) . "s";
$values = [];
foreach ($updateColumns as $column) {
    $values[] = $sanitised[$column] ?? null;
}
$values[] = $primaryValue;

mysqli_stmt_bind_param($stmt, $types, ...$values);
$executed = mysqli_stmt_execute($stmt);

if (!$executed) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update data: " . mysqli_stmt_error($stmt),
    ]);
    exit;
}

ob_clean();
echo json_encode([
    "success" => true,
    "message" => "Record updated successfully.",
    "affected_rows" => mysqli_stmt_affected_rows($stmt),
]);

