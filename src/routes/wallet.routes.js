import express from "express";
import {
  initFundWallet,
  fundWallet,
  getWalletBalance,
  getUserTransactions,
} from "../controllers/wallet.controller.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { fundWalletSchema } from "../validations/schemas.js";

const router = express.Router();

router.get("/", auth, getWalletBalance);
router.get("/transactions", auth, getUserTransactions);
router.post("/init-fund", auth, validate(fundWalletSchema), initFundWallet);
router.post("/fund", auth, fundWallet);


export default router;
