-- USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role ENUM('student','faculty','admin') NOT NULL,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(10)
);

-- DEPARTMENTS TABLE
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE
);

-- PROGRAMS TABLE
CREATE TABLE programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- CLASSES (SECTIONS) TABLE
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    program_id INT,
    room_id INT,
    FOREIGN KEY (program_id) REFERENCES programs(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- STUDENTS TABLE
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(10),
    program_id INT,
    FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- FACULTY TABLE
CREATE TABLE faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    department_id INT,
    max_hours_per_week INT DEFAULT 20,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- SUBJECTS TABLE
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('theory','lab') NOT NULL,
    hours INT NOT NULL,
    program_id INT,
    FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- FACULTY-SUBJECTS TABLE (Many-to-Many)
CREATE TABLE faculty_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT,
    subject_id INT,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- ROOMS TABLE
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    features JSON
);

-- TIMETABLE SLOTS TABLE
CREATE TABLE timetable_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT,
    subject_id INT,
    faculty_id INT,
    room_id INT,
    day_of_week VARCHAR(10),
    time_slot VARCHAR(10),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- TRUNCATE ALL TABLES (order matters due to FKs)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE timetable_slots;
TRUNCATE TABLE faculty_subjects;
TRUNCATE TABLE subjects;
TRUNCATE TABLE students;
TRUNCATE TABLE classes;
TRUNCATE TABLE faculty;
TRUNCATE TABLE users;
TRUNCATE TABLE rooms;
TRUNCATE TABLE programs;
TRUNCATE TABLE departments;
SET FOREIGN_KEY_CHECKS = 1;

-- RE-INSERT DATA
-- Only CSE Department
INSERT INTO departments (name, code) VALUES
('Computer Science', 'CSE');

-- Only CSE Program
INSERT INTO programs (name, code, department_id) VALUES
('BTech CSE', 'CSE-BT', 1);

-- Only CSE Rooms
INSERT INTO rooms (name, features) VALUES
('Room 101', '{"type": "theory"}'),
('Room 102', '{"type": "theory"}'),
('Lab 201', '{"type": "lab"}'),
('Lab 202', '{"type": "lab"}'),
('Room 103', '{"type": "theory"}'),
('Room 104', '{"type": "theory"}'),
('Room 105', '{"type": "theory"}'),
('Lab-101', '{"type": "lab"}');

-- Only CSE Sections
INSERT INTO classes (name, program_id, room_id) VALUES
('CSE-A', 1, 1),
('CSE-B', 1, 2),
('CSE-C', 1, 3),
('CSE-D', 1, 4);

-- Only CSE Faculty
INSERT INTO faculty (name, email, department_id, max_hours_per_week) VALUES
('Dr. Ram Kumar', 'ram@college.com', 1, 20),
('Dr. Sita Rao', 'sita@college.com', 1, 20),
('Dr. Ankit Sharma', 'ankit.sharma@college.com', 1, 20),
('Dr. Neha Verma', 'neha.verma@college.com', 1, 20),
('Dr. Sunil Joshi', 'sunil.joshi@college.com', 1, 20),
('Dr. Sunil Joshika', 'sunil.joshika@college.com', 1, 20),
('Dr. Sunil Joshitha', 'sunil.joshitha@college.com', 1, 20),
('Dr. Kaladhar Roy', 'kaladhar.roy@college.com', 1, 20),
('Dr. Teja', 'teja@college.com', 1, 20),
('Dr. Manu', 'manu@college.com', 1, 20);

-- Only CSE Users
INSERT INTO users (username, password, role, name, section) VALUES
('admin', 'adminpass', 'admin', 'Admin User', NULL),
('cse1', 'pass1', 'student', 'Student 1', 'CSE-A'),
('cse2', 'pass2', 'student', 'Student 2', 'CSE-B'),
('cse3', 'pass3', 'student', 'Student 3', 'CSE-C'),
('cse4', 'pass4', 'student', 'Student 4', 'CSE-D'),
('faculty1', 'fpass1', 'faculty', 'Dr. Ram Kumar', NULL);

-- Only CSE Students
INSERT INTO students (name, section, program_id) VALUES
('Student 1', 'CSE-A', 1),
('Student 2', 'CSE-B', 1),
('Student 3', 'CSE-C', 1),
('Student 4', 'CSE-D', 1);

-- Only CSE Subjects (11 total)
INSERT INTO subjects (name, type, hours, program_id) VALUES
('Data Structures', 'theory', 6, 1),
('Database Management', 'theory', 6, 1),
('Operating Systems', 'theory', 6, 1),
('Computer Networks', 'theory', 6, 1),
('Software Engineering', 'theory', 6, 1),
('DS Lab', 'lab', 3, 1),
('DBMS Lab', 'lab', 3, 1),
('OS Lab', 'lab', 3, 1),
('CN Lab', 'lab', 3, 1),
('SE Lab', 'lab', 3, 1),
('LIB', 'theory', 2, 1);

-- Faculty-Subjects (example assignments)
INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (1, 6), (2, 7), (3, 8), (4, 9), (5, 10), (6, 11);



INSERT INTO faculty (name, email, department_id, max_hours_per_week) VALUES('Dr. Sruthi', 'sruthi@college.com', 1, 20);

