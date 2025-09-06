-- User table: stores students, faculty, and admin
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'faculty', 'admin') NOT NULL,
    section_id INT,
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Section table: stores class sections
CREATE TABLE sections (
    section_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Faculty table: stores faculty details
CREATE TABLE faculty (
    faculty_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Subject table: stores subjects
CREATE TABLE subjects (
    subject_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('theory', 'lab') NOT NULL
);

-- Timetable table: stores timetable slots for each section
CREATE TABLE timetables (
    timetable_id INT PRIMARY KEY AUTO_INCREMENT,
    section_id INT NOT NULL,
    day ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
    period VARCHAR(20) NOT NULL, -- e.g., 'P1', 'P2', '09:00-10:00'
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    room VARCHAR(20),
    UNIQUE(section_id, day, period), -- Prevents overlapping classes in a section
    FOREIGN KEY (section_id) REFERENCES sections(section_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
);

-- Faculty assignment: which faculty teaches which subject in which section
CREATE TABLE faculty_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_id INT NOT NULL,
    subject_id INT NOT NULL,
    section_id INT NOT NULL,
    UNIQUE(faculty_id, subject_id, section_id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

-- Constraint: Prevent a faculty from being assigned to two classes at the same time
CREATE TABLE faculty_timetable_conflicts (
    conflict_id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_id INT NOT NULL,
    day ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
    period VARCHAR(20) NOT NULL,
    timetable_id INT NOT NULL,
    UNIQUE(faculty_id, day, period),
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (timetable_id) REFERENCES timetables(timetable_id)
);

-- Student-section mapping
CREATE TABLE student_sections (
    student_id INT NOT NULL,
    section_id INT NOT NULL,
    PRIMARY KEY (student_id, section_id),
    FOREIGN KEY (student_id) REFERENCES users(user_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

-- Indexes for fast lookup
CREATE INDEX idx_timetable_section ON timetables(section_id);
CREATE INDEX idx_timetable_faculty ON timetables(faculty_id);
CREATE INDEX idx_timetable_subject ON timetables(subject_id);
