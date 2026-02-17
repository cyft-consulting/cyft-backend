import express from "express";
import {
  createTask,
  getAllTasks,
  getStaffTasks,
  submitTask,
  acceptTask,
  rejectTask
} from "../controllers/task.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

// Admin routes
router.post("/", authMiddleware, adminOnly, createTask);
router.get("/all", authMiddleware, adminOnly, getAllTasks);
router.put("/accept", authMiddleware, adminOnly, acceptTask);
router.put("/reject", authMiddleware, adminOnly, rejectTask);

// Staff routes
router.get("/my-tasks", authMiddleware, getStaffTasks);
router.post("/submit", authMiddleware, submitTask);

export default router;
