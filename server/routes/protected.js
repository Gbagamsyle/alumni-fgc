import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", protect, (req, res) => {
  res.json({
    message: "Welcome to dashboard",
    user: req.user
  });
});

export default router;
