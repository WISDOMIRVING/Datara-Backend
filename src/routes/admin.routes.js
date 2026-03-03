import express from "express";
import {
  users,
  transactions,
  updatePricing,
  refund,
  toggleUserStatus,
  getStats,
} from "../controllers/admin.controller.js";
import auth from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";


const router = express.Router();

router.use(auth, adminOnly);

router.get("/users", users);
router.get("/transactions", transactions);
router.get("/stats", getStats);
router.put("/pricing", updatePricing);

router.post("/refund", refund);
router.post("/status", toggleUserStatus);

export default router;
