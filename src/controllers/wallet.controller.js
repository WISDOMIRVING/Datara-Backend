import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import { verifyPayment } from "../services/paystack.service.js";
import axios from "axios";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const fundWallet = asyncHandler(async (req, res) => {
  const { reference } = req.body;
  if (!reference) {
    throw new ApiError(400, "Payment reference is required");
  }

  const payment = await verifyPayment(reference);
  if (!payment.data.status) {
    throw new ApiError(400, "Payment verification failed");
  }

  const wallet = await Wallet.findOne({ userId: req.user.id });
  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  wallet.balance += payment.data.amount / 100;
  await wallet.save();

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
  if (!amount || amount <= 0) {
    throw new ApiError(400, "A valid amount is required");
  }

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: req.user.email,
      amount: amount * 100,
      metadata: { userId: req.user.id },
      callback_url: `${process.env.FRONTEND_URL}/dashboard`,
    },
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
    }
  );

  res.json({
    success: true,
    authorization_url: response.data.data.authorization_url,
  });
});
