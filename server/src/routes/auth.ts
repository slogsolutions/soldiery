import { Router } from "express";
import {getMe, login, logout } from "../controllers/auth";
import { protect } from "../middlewares/auth";

const router = Router();
 
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
 
export default router;