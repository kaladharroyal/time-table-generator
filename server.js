import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = await mysql.createPool({
  host: "localhost",
  user: "kaladharroyal",          // 🔹 change this
  password: "Kaladhar*011", // 🔹 change this
  database: "timetable_db"
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND role = ?",
      [username, role]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      role: user.role,
      user_id: user.user_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
