-- USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'student') NOT NULL,
    name VARCHAR(100) NOT NULL,
    branch VARCHAR(50),
    section VARCHAR(10)
);

-- DEPARTMENTS TABLE
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- PROGRAMS TABLE
CREATE TABLE programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    department_id INT,
    start_year INT,
    strength INT DEFAULT 0,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- STUDENTS TABLE
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    program_id INT,
    section VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- FACULTY TABLE
CREATE TABLE faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100),
    department_id INT,
    max_hours_per_week INT DEFAULT 20,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- SUBJECTS TABLE
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    is_lab BOOLEAN DEFAULT FALSE,
    required_room_type ENUM('lecture_hall', 'lab', 'any') DEFAULT 'any',
    required_features JSON
);

-- PROGRAM-SUBJECTS TABLE
CREATE TABLE program_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    subject_id INT,
    hours_per_week INT DEFAULT 3,
    FOREIGN KEY (program_id) REFERENCES programs(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- ROOMS TABLE
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    room_type ENUM('lecture_hall', 'lab', 'tutorial_room') DEFAULT 'lecture_hall',
    features JSON
);

-- FACULTY-SUBJECTS TABLE (Many-to-Many)
CREATE TABLE faculty_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT,
    subject_id INT,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- FACULTY AVAILABILITY TABLE
CREATE TABLE faculty_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT,
    day_of_week INT,
    time_slot INT,
    is_available BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id)
);

-- TIMETABLE SLOTS TABLE
CREATE TABLE timetable_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    subject_id INT,
    faculty_id INT,
    room_id INT,
    day_of_week INT,
    time_slot INT,
    FOREIGN KEY (program_id) REFERENCES programs(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- GLOBAL UNAVAILABLE SLOTS TABLE
CREATE TABLE global_unavailable_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week INT,
    time_slot INT,
    reason VARCHAR(255)
);
