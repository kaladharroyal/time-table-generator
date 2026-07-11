# Time Table Generator

A web-based Time Table Generator application built with a Flask backend, MySQL database, and a clean, responsive HTML/CSS/JavaScript frontend. It includes roles for Admins (to generate/manage schedules), Faculty, and Students (to view their schedules).

---

## 🛠️ Prerequisites

Before running the application, make sure you have the following installed on your system:

1. **Python 3.8+** (Python 3.11+ is recommended)
2. **MySQL Server** (e.g., MySQL Community Server, or via XAMPP / WampServer)
3. **A Web Browser** (Chrome, Edge, Firefox, etc.)

---

## ⚙️ Configuration & Setup

### 1. Database Configuration Warning
> [!IMPORTANT]
> The database connection parameters are configured in two places:
> - **Backend Server:** [app.py](file:///D:/kaladharroyal/time-table-generator-main/app.py) uses a hardcoded dictionary named `DB_CONFIG` at the top of the file (lines 6-11):
>   ```python
>   DB_CONFIG = {
>       'host': 'localhost',
>       'user': 'root',
>       'password': 'Kaladhar*011', # Change this to your MySQL password
>       'database': 'time_table'
>   }
>   ```
> - **Database Setup Script:** [setup_db.py](file:///D:/kaladharroyal/time-table-generator-main/setup_db.py) loads settings from the [.env](file:///D:/kaladharroyal/time-table-generator-main/.env) file:
>   ```env
>   MYSQL_HOST=localhost
>   MYSQL_USER=root
>   MYSQL_PASSWORD=Kaladhar*011
>   MYSQL_DB=timetable_generator
>   ```
> 
> Ensure your MySQL server's `root` password matches **`Kaladhar*011`**, or update both the [app.py](file:///D:/kaladharroyal/time-table-generator-main/app.py) `DB_CONFIG` password and [.env](file:///D:/kaladharroyal/time-table-generator-main/.env) files with your correct credentials before running setup/app scripts.

---

## 🚀 How to Run the Application

Follow these steps to set up and run the application:

### Step 1: Set Up Python Virtual Environment
It is recommended to run the app inside a virtual environment.

- **Using Windows Command Prompt (cmd):**
  ```cmd
  python -m venv .venv
  .venv\Scripts\activate
  ```
- **Using Windows PowerShell:**
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```

### Step 2: Install Required Dependencies
Install the required packages listed in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Step 3: Initialize the MySQL Database
Make sure your local MySQL server is **running**. Then execute the setup script. This script will automatically connect to MySQL, create the `time_table` database, generate the tables, and populate seed data:
```bash
python setup_db.py
```
*(Verify that the console outputs: `Database setup successfully completed!`)*

### Step 4: Start the Flask Application Server
Run the Flask server:
```bash
python app.py
```

The application will start, and the console will output:
```text
🚀 Timetable Generator Server Started!
...
   http://localhost:5000/
```

### Step 5: Open in Your Browser
Navigate to **`http://localhost:5000/`** (or `http://localhost:5000/login.html`) to access the application.

---

## 🔑 Default Login Credentials

The database initialization inserts default user credentials for testing. You can use these accounts to log in:

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `adminpass` | Full control to view and save schedules |
| **Faculty** | `faculty1` | `fpass1` | Log in as Dr. Ram Kumar to view schedule |
| **Student** (Section A) | `cse1` | `pass1` | Log in to view CSE-A student schedule |
| **Student** (Section B) | `cse2` | `pass2` | Log in to view CSE-B student schedule |
| **Student** (Section C) | `cse3` | `pass3` | Log in to view CSE-C student schedule |
| **Student** (Section D) | `cse4` | `pass4` | Log in to view CSE-D student schedule |

---

## 📁 Project Structure

Here is a summary of the key files in the repository:
- 📄 [app.py](file:///D:/kaladharroyal/time-table-generator-main/app.py): The main Flask backend code providing routing, API endpoints (auth, timetable generation, department details, saving/loading timetable slots), and serves the frontend files.
- 📄 [setup_db.py](file:///D:/kaladharroyal/time-table-generator-main/setup_db.py): Python utility script to automate MySQL database creation, schema parsing, and seed insertion.
- 📄 [schema.sql](file:///D:/kaladharroyal/time-table-generator-main/schema.sql): Contains the SQL statements to initialize tables (users, departments, programs, classes, students, faculty, subjects, rooms, timetable_slots) and load sample seed data.
- 📁 [static/](file:///D:/kaladharroyal/time-table-generator-main/static): Contains static frontend web pages and assets:
  - `login.html`: Portal entry page.
  - `AdminDashboard.html`: Interface for admin features (scheduling, sections).
  - `FacultyDashboard.html`: Faculty schedule view.
  - `StudentDashboard.html`: Student schedule view.
  - `script.js` / `styles.css`: Visual styling and API call bindings.