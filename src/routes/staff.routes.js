import express from "express";
import { createStaff, deleteStaff, getAllStaff } from "../controllers/staff.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, adminOnly, getAllStaff);
router.post("/", authMiddleware, adminOnly, createStaff);
router.delete("/:id", authMiddleware, adminOnly, deleteStaff);

export default router;
