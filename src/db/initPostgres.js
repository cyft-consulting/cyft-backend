import { pool } from "./postgres.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export const initPostgres = async () => {
  // 1️⃣ Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      isActive BOOLEAN,
      name TEXT,
      department TEXT,
      dateCreated TEXT,
      tempPassword TEXT,
      resetToken TEXT,
      resetTokenExpiry BIGINT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assignedTo UUID,
      status TEXT DEFAULT 'IN_PROGRESS',
      createdBy UUID,
      createdAt TEXT,
      deadline TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_submissions (
      id UUID PRIMARY KEY,
      taskId UUID,
      staffId UUID,
      text TEXT,
      files TEXT,
      submittedAt TEXT,
      reviewStatus TEXT DEFAULT 'PENDING',
      rejectionReason TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title TEXT,
      description TEXT,
      createdBy UUID,
      createdByRole TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcement_seen (
      id SERIAL PRIMARY KEY,
      announcementId INTEGER,
      userId UUID,
      seenAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (announcementId, userId)
    );
  `);

  console.log("✅ PostgreSQL tables ready");

  // 2️⃣ Seed admin if not exists
  const admin = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [process.env.ADMIN_EMAIL]
  );

  if (admin.rowCount === 0) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO users (id, email, password, role, isActive) VALUES ($1, $2, $3, 'ADMIN', true)`,
      [uuidv4(), process.env.ADMIN_EMAIL, hashedPassword]
    );
    console.log("✅ Admin created successfully!");
  }
};
