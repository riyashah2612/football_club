<?php

function get_allowed_tables(): array
{
    return [
        "clubs" => [
            "Club_ID",
            "Club_Name",
            "City",
        ],
        "coach" => [
            "Coach_ID",
            "Coach_Name",
            "Years_of_experience",
            "Salary",
            "Coach_PhoneNumber",
            "Club_ID",
        ],
        "employee" => [
            "Emp_ID",
            "Emp_Name",
            "Emp_Salary",
            "Emp_Dept",
            "Emp_PhoneNumber",
        ],
        "matches" => [
            "Match_ID",
            "Date",
            "Time",
            "Home_Team",
            "Away_Team",
            "Result",
            "Venue_ID",
        ],
        "players" => [
            "Player_ID",
            "Player_Name",
            "Player_DOB",
            "Gender",
            "Height_in_cm",
            "Weight_in_kg",
            "No_of_Matches",
            "Player_PhoneNumber",
            "Club_ID",
        ],
        "training_session" => [
            "TS_ID",
            "TS_Date",
            "TS_Time",
            "Duration",
            "Type",
            "Gear",
            "Coach_ID",
            "Venue_ID",
        ],
        "venue" => [
            "Venue_ID",
            "Venue_Name",
            "Venue_Location",
        ],
    ];
}

function validate_table(string $table): bool
{
    $allowed = get_allowed_tables();
    return array_key_exists($table, $allowed);
}

function validate_columns(string $table, array $columns): array
{
    $allowed = get_allowed_tables();
    if (!isset($allowed[$table])) {
        return [];
    }
    return array_values(array_intersect($columns, $allowed[$table]));
}

function sanitize_input(array $data): array
{
    $sanitized = [];
    foreach ($data as $key => $value) {
        if (is_string($value)) {
            $sanitized[$key] = trim($value);
        } else {
            $sanitized[$key] = $value;
        }
    }
    return $sanitized;
}

