import { pool } from "../db/postgres.js";
import { v4 as uuidv4 } from "uuid";

/**
 * CREATE TASK (Admin Only)
 */
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, deadline } = req.body;
    const adminId = req.user.id;
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO tasks (id, title, description, assignedTo, status, createdBy, createdAt, deadline)
       VALUES ($1, $2, $3, $4, 'IN_PROGRESS', $5, $6, $7)`,
      [uuidv4(), title, description, assignedTo, adminId, createdAt, deadline]
    );

    res.status(201).json({ message: "Task created successfully" });
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(400).json({ message: "Error creating task" });
  }
};

/**
 * GET ALL TASKS (Admin) including submissions
 */
export const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        u.name AS staffName,
        a.email AS adminEmail,
        s.id AS submissionId,
        s.text AS submissionText,
        s.files AS submissionFiles,
        s.reviewStatus,
        s.rejectionReason,
        s.submittedAt
      FROM tasks t
      LEFT JOIN users u ON t.assignedTo = u.id
      LEFT JOIN users a ON t.createdBy = a.id
      LEFT JOIN task_submissions s ON t.id = s.taskId
      ORDER BY t.createdAt DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

/**
 * GET TASKS FOR STAFF
 */
export const getStaffTasks = async (req, res) => {
  try {
    const staffId = req.user.id;

    const result = await pool.query(
      `SELECT t.*, s.text AS submissionText, s.files AS submissionFiles, s.reviewStatus, s.rejectionReason
       FROM tasks t
       LEFT JOIN task_submissions s ON t.id = s.taskId AND s.staffId = $1
       WHERE t.assignedTo = $1`,
      [staffId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching staff tasks:", err);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

/**
 * SUBMIT TASK (Staff)
 */
export const submitTask = async (req, res) => {
  try {
    const { taskId, text, fileUrl } = req.body;
    const staffId = req.user.id;
    const submittedAt = new Date().toISOString();

    // Prepare files as JSON array only if fileUrl exists
    const files = fileUrl ? JSON.stringify([fileUrl]) : null;

    await pool.query(
      `INSERT INTO task_submissions (id, taskId, staffId, text, files, submittedAt, reviewStatus)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
      [uuidv4(), taskId, staffId, text, files, submittedAt]
    );

    res.json({ message: "Task submitted successfully", fileUrl: fileUrl || null });
  } catch (err) {
    console.error("Error submitting task:", err);
    res.status(400).json({ message: "Error submitting task" });
  }
};

/**
 * ACCEPT TASK (Admin)
 */
export const acceptTask = async (req, res) => {
  try {
    const { taskId, submissionId } = req.body;

    await pool.query(`UPDATE task_submissions SET reviewStatus='ACCEPTED' WHERE id=$1`, [submissionId]);
    await pool.query(`UPDATE tasks SET status='COMPLETED' WHERE id=$1`, [taskId]);

    res.json({ message: "Task accepted" });
  } catch (err) {
    console.error("Error accepting task:", err);
    res.status(400).json({ message: "Error accepting task" });
  }
};

/**
 * REJECT TASK (Admin)
 */
export const rejectTask = async (req, res) => {
  try {
    const { taskId, submissionId, reason } = req.body;

    await pool.query(
      `UPDATE task_submissions SET reviewStatus='REJECTED', rejectionReason=$1 WHERE id=$2`,
      [reason, submissionId]
    );
    await pool.query(`UPDATE tasks SET status='REJECTED' WHERE id=$1`, [taskId]);

    res.json({ message: "Task rejected" });
  } catch (err) {
    console.error("Error rejecting task:", err);
    res.status(400).json({ message: "Error rejecting task" });
  }
};

/**
 * DELETE TASK (Admin)
 */
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Delete submissions first
    await pool.query(`DELETE FROM task_submissions WHERE taskId = $1`, [taskId]);

    // Then delete task
    const result = await pool.query(`DELETE FROM tasks WHERE id = $1 RETURNING *`, [taskId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ message: "Error deleting task" });
  }
};
