import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import {
  buyAirtime,
  buyData,
  payElectricity,
  subscribeCable,
  buyExamPin,
} from "../services/vtu.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const processVTU = async ({ userId, amount, serviceType, handler, payload }) => {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  if (wallet.balance < amount) {
    throw new ApiError(400, "Insufficient balance");
  }

  wallet.balance -= amount;
  wallet.lockedBalance += amount;
  await wallet.save();

  let response;
  try {
    response = await handler(payload);

    wallet.lockedBalance -= amount;
    await wallet.save();

    await Transaction.create({
      userId,
      serviceType,
      amount,
      status: "SUCCESS",
      apiResponse: response,
    });

    return response;
  } catch (err) {
    // Rollback on failure
    wallet.balance += amount;
    wallet.lockedBalance -= amount;
    await wallet.save();

    await Transaction.create({
      userId,
      serviceType,
      amount,
      status: "FAILED",
      apiResponse: err.message,
    });

    throw err;
  }
};

export const airtime = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    throw new ApiError(400, "A valid amount is required");
  }

  const response = await processVTU({
    userId: req.user.id,
    amount,
    serviceType: "AIRTIME",
    handler: buyAirtime,
    payload: req.body,
  });
  res.json({ success: true, data: response });
});

export const data = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    throw new ApiError(400, "A valid amount is required");
  }

  const response = await processVTU({
    userId: req.user.id,
    amount,
    serviceType: "DATA",
    handler: buyData,
    payload: req.body,
  });
  res.json({ success: true, data: response });
});

export const electricity = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    throw new ApiError(400, "A valid amount is required");
  }

  const response = await processVTU({
    userId: req.user.id,
    amount,
    serviceType: "ELECTRICITY",
    handler: payElectricity,
    payload: req.body,
  });
  res.json({ success: true, data: response });
});

export const cable = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    throw new ApiError(400, "A valid amount is required");
  }

  const response = await processVTU({
    userId: req.user.id,
    amount,
    serviceType: "CABLE",
    handler: subscribeCable,
    payload: req.body,
  });
  res.json({ success: true, data: response });
});

export const exam = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    throw new ApiError(400, "A valid amount is required");
  }

  const response = await processVTU({
    userId: req.user.id,
    amount,
    serviceType: "EXAM",
    handler: buyExamPin,
    payload: req.body,
  });
  res.json({ success: true, data: response });
});
