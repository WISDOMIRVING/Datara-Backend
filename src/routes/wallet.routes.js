import express from "express";
import {
  initFundWallet,
  getWalletBalance,
  getUserTransactions,
} from "../controllers/wallet.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getWalletBalance);
router.get("/transactions", auth, getUserTransactions);
router.post("/topup", auth, initFundWallet); // Matches frontend service

export default router;
