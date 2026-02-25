import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import ServicePricing from "../models/ServicePricing.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const users = asyncHandler(async (req, res) => {
  const allUsers = await User.find();
  res.json({ success: true, data: allUsers });
});

export const transactions = asyncHandler(async (req, res) => {
  const allTransactions = await Transaction.find().sort({ createdAt: -1 });
  res.json({ success: true, data: allTransactions });
});

export const updatePricing = asyncHandler(async (req, res) => {
  const { id, ...updates } = req.body;
  if (!id) {
    throw new ApiError(400, "Pricing ID is required");
  }

  const pricing = await ServicePricing.findByIdAndUpdate(id, updates, {
    new: true,
  });
  if (!pricing) {
    throw new ApiError(404, "Pricing record not found");
  }

  res.json({ success: true, data: pricing });
});

export const refund = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    throw new ApiError(400, "Transaction ID is required");
  }

  const tx = await Transaction.findById(transactionId);
  if (!tx) {
    throw new ApiError(404, "Transaction not found");
  }

  tx.status = "REFUNDED";
  await tx.save();

  res.json({ success: true, message: "Refund completed" });
});
