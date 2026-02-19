import express from "express";
import { login, requestPasswordReset, resetPassword  } from "../controllers/auth.controller.js";

const router = express.Router();
router.post("/login", login);
// POST /api/auth/forgot-password
router.post("/request-password-reset", requestPasswordReset);

// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

export default router;
