import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  markSeen,
  deleteAnnouncement,
} from "../controllers/announcement.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createAnnouncement);
router.get("/", authMiddleware, getAnnouncements);
router.post("/:id/seen", authMiddleware, markSeen);
router.delete("/:id", authMiddleware, deleteAnnouncement);

export default router;
