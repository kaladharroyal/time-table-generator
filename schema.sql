-- USERS TABLE
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'faculty', 'student')) NOT NULL,
    name TEXT NOT NULL,
    branch TEXT,
    section TEXT  -- only for students
);

-- SUBJECTS TABLE
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('theory', 'lab')) NOT NULL,
    hours INTEGER NOT NULL,
    faculty_id INTEGER,
    FOREIGN KEY (faculty_id) REFERENCES users(id)
);

-- TIMETABLE TABLE
CREATE TABLE timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch TEXT NOT NULL,
    section TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    period_number TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    faculty_id INTEGER,
    type TEXT,
    classroom TEXT,
    FOREIGN KEY (faculty_id) REFERENCES users(id)
);

-- (Optional) FACULTY-SUBJECT RELATION if you want many-to-many
CREATE TABLE faculty_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER,
    subject_id INTEGER,
    FOREIGN KEY (faculty_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
