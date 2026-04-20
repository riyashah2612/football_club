# Football Club Management System

A full-stack web application for managing football club operations such as players, coaches, matches, training sessions, venues, and employees using a relational database.

The project was developed as part of a **Database Management Systems (DBMS) academic course**, in collaboration with peers, to apply practical concepts of database design and full-stack web development.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (AJAX)  
- **Backend:** PHP (MySQLi)  
- **Database:** MySQL  



## Features

- CRUD operations for players, coaches, matches, training sessions, venues, and employees  
- Relational database design with foreign key constraints  
- SQL trigger for basic data validation  
- Search functionality using PHP backend APIs  
- Dashboard-based interface for managing different entities  
- AJAX-based communication between frontend and backend  
- Modular backend APIs for each CRUD operation  



## Database Overview

The system is built on a relational schema with multiple interconnected tables:

- Clubs  
- Players  
- Coaches  
- Matches  
- Training Sessions  
- Venues  
- Employees  
- Junction tables (play, attends, register)

### Example Constraint

- Player weight validation trigger ensures minimum weight requirement



## Backend Structure

- `fetch_data.php` → Fetch records from database  
- `insert_data.php` → Insert new records  
- `update_data.php` → Update existing records  
- `delete_data.php` → Delete records  
- `search_data.php` → Search records using filters  
- `db_config.php` → Database connection configuration  

All database queries use prepared statements with controlled table access to improve security and prevent SQL injection.



## Frontend Structure

- Dashboard-based UI for different user roles  
- Separate pages for each entity (players, coaches, matches, etc.)  
- Employee dashboard for CRUD operations  
- Read-only views for players and coaches  
- Responsive design using CSS and JavaScript  



## Project Structure

```plaintext
football_club/
├── frontend/
│   ├── index.html              # Landing page with login modals
│   ├── player-dashboard.html   # Player interface
│   ├── coach-dashboard.html    # Coach interface
│   ├── employee-dashboard.html # Admin CRUD interface
│   ├── players.html            # Player directory
│   ├── coaches.html            # Coach directory
│   ├── employees.html          # Employee directory
│   ├── matches.html            # Match listings
│   ├── training.html           # Training session listings
│   ├── venues.html             # Venue directory
│   ├── clubs.html              # Club directory
│   ├── styles.css              # Responsive styling
│   └── script.js               # AJAX & DOM manipulation
│
├── backend/
│   ├── db_config.php           # Database connection
│   ├── fetch_data.php          # GET all records
│   ├── search_data.php         # Search endpoint
│   ├── insert_data.php         # Create records
│   ├── update_data.php         # Update records
│   └── delete_data.php         # Delete records
│
└── README.md
```


## How to Run

1. Install a local server environment (XAMPP / WAMP / LAMP)  
2. Create a database named `football_club` in MySQL  
3. Import or execute the schema SQL scripts  
4. Update database credentials in `backend/db_config.php`  
5. Start Apache and MySQL services  
6. Open the application in browser:
http://localhost/football-club/frontend/index.html 



## Future Improvements
- Role-based authentication system
- Improved UI with modern frontend framework
- Deployment on cloud platform



## About This Project

This project was developed as part of a **DBMS academic course** in collaboration with peers. It demonstrates practical implementation of relational database design, CRUD operations, and backend API integration using PHP and MySQL.
