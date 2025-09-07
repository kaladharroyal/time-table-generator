import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

// Database connection
const db = await mysql.createPool({
  host: "localhost",
  user: "kaladharroyal",          // 🔹 change this
  password: "Kaladhar*011", // 🔹 change this
  database: "timetable_db"
});

// Function to insert users
async function seedUsers() {
  try {
    // Hash passwords
    const adminPass = await bcrypt.hash("admin123", 10);
    const facultyPass = await bcrypt.hash("1234", 10);
    const studentPass = await bcrypt.hash("1234", 10);

    // Insert users (ignore if username already exists)
    await db.query(
      `INSERT IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      ["admin", adminPass, "admin"]
    );

    await db.query(
      `INSERT IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      ["ram@college.com", facultyPass, "faculty"]
    );

    await db.query(
      `INSERT IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      ["23CSE001", studentPass, "student"]
    );

    console.log("✅ Default users seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  }
}

seedUsers();
