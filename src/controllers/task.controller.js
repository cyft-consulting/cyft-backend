import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

// Create Task (Admin Only)
export const createTask = (req, res) => {
  const { title, description, assignedTo, deadline } = req.body;
  const adminId = req.user.id;  // From auth middleware
  const createdAt = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO tasks (id, title, description, assignedTo, status, createdBy, createdAt, deadline)
      VALUES (?, ?, ?, ?, 'IN_PROGRESS', ?, ?, ?)
    `).run(uuidv4(), title, description, assignedTo, adminId, createdAt, deadline);

    res.status(201).json({ message: "Task created successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error creating task" });
  }
};

// Get all tasks (Admin) including submissions
export const getAllTasks = (req, res) => {
    try {
      const tasks = db.prepare(`
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
      `).all();
  
      res.json(tasks);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching tasks" });
    }
  };
   

// Get tasks for a specific staff
export const getStaffTasks = (req, res) => {
  const staffId = req.user.id;
  const tasks = db.prepare(`
    SELECT t.*, s.text AS submissionText, s.files AS submissionFiles, s.reviewStatus, s.rejectionReason
    FROM tasks t
    LEFT JOIN task_submissions s ON t.id = s.taskId AND s.staffId = ?
    WHERE t.assignedTo = ?
  `).all(staffId, staffId);

  res.json(tasks);
};

// Submit a task (Staff)
export const submitTask = (req, res) => {
  const { taskId, text, files } = req.body;
  const staffId = req.user.id;
  const submittedAt = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO task_submissions (id, taskId, staffId, text, files, submittedAt, reviewStatus)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(uuidv4(), taskId, staffId, text, JSON.stringify(files || []), submittedAt);

    res.json({ message: "Task submitted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error submitting task" });
  }
};

// Accept Task (Admin)
export const acceptTask = (req, res) => {
  const { taskId, submissionId } = req.body;

  db.prepare(`UPDATE task_submissions SET reviewStatus='ACCEPTED' WHERE id=?`).run(submissionId);
  db.prepare(`UPDATE tasks SET status='COMPLETED' WHERE id=?`).run(taskId);

  res.json({ message: "Task accepted" });
};

// Reject Task (Admin)
export const rejectTask = (req, res) => {
  const { taskId, submissionId, reason } = req.body;

  db.prepare(`
    UPDATE task_submissions 
    SET reviewStatus='REJECTED', rejectionReason=? 
    WHERE id=?
  `).run(reason, submissionId);

  db.prepare(`UPDATE tasks SET status='REJECTED' WHERE id=?`).run(taskId);

  res.json({ message: "Task rejected" });
};

// Delete Task (Admin)
export const deleteTask = (req, res) => {
    const { taskId } = req.params;
  
    try {
      // First delete submissions
      db.prepare(`
        DELETE FROM task_submissions WHERE taskId = ?
      `).run(taskId);
  
      // Then delete the task
      const result = db.prepare(`
        DELETE FROM tasks WHERE id = ?
      `).run(taskId);
  
      if (result.changes === 0) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      res.json({ message: "Task deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error deleting task" });
    }
  };
  