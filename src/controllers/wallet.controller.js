import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import axios from "axios";
import { verifyPayment } from "../services/paystack.service.js";
import { creditWallet } from "../services/wallet.service.js";
import logger from "../utils/logger.js";

export const fundWallet = asyncHandler(async (req, res) => {
  const { reference } = req.body;
  if (!reference) {
    throw new ApiError(400, "Payment reference is required");
  }

  // Check if transaction already processed to avoid double credit
  const existingTx = await Transaction.findOne({ reference, status: "SUCCESS" });
  if (existingTx) {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    return res.json({ success: true, balance: wallet.balance, message: "Already processed" });
  }

  const payment = await verifyPayment(reference);
  if (!payment.data.status || payment.data.status !== "success") {
    throw new ApiError(400, "Payment verification failed or pending");
  }

  const creditAmount = payment.data.amount / 100;
  const userId = payment.data.metadata.userId;

  const wallet = await creditWallet({
    userId,
    amount: creditAmount,
    reference,
    apiResponse: payment.data
  });

  res.json({ success: true, balance: wallet.balance });
});

export const getWalletBalance = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user.id });
  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  res.json({ success: true, data: wallet });
});

export const getUserTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  res.json({ success: true, data: transactions });
});

export const initFundWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  console.log("💰 [INIT FUND] Request Payload:", req.body);
  console.log("👤 [USER INFO]:", { id: req.user?._id, email: req.user?.email });

  logger.info(`💰 Wallet funding initiated: ${amount} by ${req.user.email}`);


  if (!amount || amount < 100) {
    throw new ApiError(400, "Minimum funding amount is ₦100");
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: Math.round(amount * 100), // Ensure it's an integer
        metadata: { userId: req.user._id },
        callback_url: `${process.env.FRONTEND_URL}/dashboard`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json"
        },
      }
    );

    res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
    });
  } catch (error) {
    const errorData = error.response?.data;
    logger.error("❌ Paystack Initialization Failed:", {
      status: error.response?.status,
      message: errorData?.message || error.message,
      data: errorData
    });

    throw new ApiError(
      error.response?.status || 500,
      errorData?.message || "Could not initialize payment with Paystack"
    );
  }
});

