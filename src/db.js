import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
console.log("🔥 SQLITE DB PATH:", dbPath);

const db = new Database(dbPath);

// Create users table if it doesn't exist
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT,
  isActive INTEGER
)
`).run();

// Create tasks table
db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assignedTo TEXT,
      status TEXT DEFAULT 'IN_PROGRESS',
      createdBy TEXT,
      createdAt TEXT,
      deadline TEXT,
      FOREIGN KEY (assignedTo) REFERENCES users(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
    `).run();

    // Create task_submissions table
db.prepare(`
    CREATE TABLE IF NOT EXISTS task_submissions (
      id TEXT PRIMARY KEY,
      taskId TEXT,
      staffId TEXT,
      text TEXT,
      files TEXT,
      submittedAt TEXT,
      reviewStatus TEXT DEFAULT 'PENDING',
      rejectionReason TEXT,
      FOREIGN KEY (taskId) REFERENCES tasks(id),
      FOREIGN KEY (staffId) REFERENCES users(id)
    )
    `).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        createdBy INTEGER NOT NULL,
        createdByRole TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
         )
    `).run();

      db.prepare(`
      CREATE TABLE IF NOT EXISTS announcement_seen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        announcementId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        seenAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (announcementId, userId)
         )
    `).run();
      
// Add missing columns if they don't exist
const columns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);

// Add 'name' column
if (!columns.includes("name")) {
  db.prepare("ALTER TABLE users ADD COLUMN name TEXT").run();
}

// Add 'department' column
if (!columns.includes("department")) {
  db.prepare("ALTER TABLE users ADD COLUMN department TEXT").run();
}

// Add 'dateCreated' column
if (!columns.includes("dateCreated")) {
  db.prepare("ALTER TABLE users ADD COLUMN dateCreated TEXT").run();
}

// Add 'tempPassword' column for storing temporary passwords
if (!columns.includes("tempPassword")) {
    db.prepare("ALTER TABLE users ADD COLUMN tempPassword TEXT").run();
  }

if (!columns.includes("resetToken")) {
  db.prepare("ALTER TABLE users ADD COLUMN resetToken TEXT").run();
}

if (!columns.includes("resetTokenExpiry")) {
  db.prepare("ALTER TABLE users ADD COLUMN resetTokenExpiry INTEGER").run();
}
  
// Seed admin if not exists
const admin = db.prepare("SELECT * FROM users WHERE email = ?").get(process.env.ADMIN_EMAIL);

if (!admin) {
  const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  db.prepare(`
    INSERT INTO users (id, email, password, role, isActive) VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), process.env.ADMIN_EMAIL, hashedPassword, "ADMIN", 1);
  console.log("Admin created successfully!");
}

export default db;