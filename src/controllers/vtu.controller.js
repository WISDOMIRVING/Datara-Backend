import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import WalletLog from "../models/WalletLog.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import sendEmail from "../utils/sendEmail.js";
import { purchaseTemplate } from "../utils/emailTemplates.js";
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ⚛️ Atomic Balance Operation (Prevents Race Conditions)
    const wallet = await Wallet.findOneAndUpdate(
      { userId, balance: { $gte: amount } },
      { $inc: { balance: -amount, lockedBalance: amount } },
      { new: true, session }
    );

    if (!wallet) {
      const exists = await Wallet.findOne({ userId }).session(session);
      if (!exists) throw new ApiError(404, "Wallet not found");
      throw new ApiError(400, "Insufficient balance or transaction pending");
    }

    let response;
    try {
      // ⚠️ External API call is OUTSIDE the DB session commit but inside the try block
      response = await handler(payload);

      // Release locked balance and create logs
      await Wallet.findByIdAndUpdate(wallet._id, { $inc: { lockedBalance: -amount } }, { session });

      await WalletLog.create([{
        walletId: wallet._id,
        amount: -amount,
        type: "DEBIT",
        reason: `VTU Purchase: ${serviceType}`,
        balanceBefore: wallet.balance + amount,
        balanceAfter: wallet.balance
      }], { session });

      await Transaction.create([{
        userId,
        serviceType,
        amount,
        status: "SUCCESS",
        apiResponse: response,
      }], { session });

      // Commit DB changes
      await session.commitTransaction();

      // Async Notification (outside transaction)
      User.findById(userId).then(user => {
        if (user) {
          sendEmail({
            to: user.email,
            subject: `Transaction Successful: ${serviceType}`,
            html: purchaseTemplate(serviceType, amount, "SUCCESS"),
          }).catch(err => logger.error("VTU Success Email Failed", { err }));
        }
      });

      return response;
    } catch (apiErr) {
      // Rollback DB changes if API fails
      await session.abortTransaction();

      // Separate session for failure logging
      const failSession = await mongoose.startSession();
      failSession.startTransaction();
      try {
        await Transaction.create([{
          userId,
          serviceType,
          amount,
          status: "FAILED",
          apiResponse: apiErr.message,
        }], { session: failSession });
        await failSession.commitTransaction();
      } finally {
        failSession.endSession();
      }

      logger.warn(`VTU Provider Error: ${serviceType}`, { error: apiErr.message, userId });
      throw apiErr;
    }
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    session.endSession();
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
