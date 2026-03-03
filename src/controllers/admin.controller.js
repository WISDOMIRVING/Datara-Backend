import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";
import WalletLog from "../models/WalletLog.js";
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

  if (tx.status === "REFUNDED") {
    throw new ApiError(400, "Transaction is already refunded");
  }

  const wallet = await Wallet.findOne({ userId: tx.userId });
  if (!wallet) {
    throw new ApiError(404, "Target wallet not found");
  }

  const balanceBefore = wallet.balance;
  wallet.balance += tx.amount;
  await wallet.save();

  // Log refund
  await WalletLog.create({
    walletId: wallet._id,
    amount: tx.amount,
    type: "CREDIT",
    reason: `Refund: ${tx.serviceType} (TXID: ${tx._id})`,
    balanceBefore: balanceBefore,
    balanceAfter: wallet.balance
  });

  tx.status = "REFUNDED";
  await tx.save();

  res.json({ success: true, message: "Refund completed and wallet credited" });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isLocked = !user.isLocked;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isLocked ? "locked" : "unlocked"} successfully`,
    isLocked: user.isLocked
  });
});

export const getStats = asyncHandler(async (req, res) => {
  // 1. Overview Metrics
  const totalUsers = await User.countDocuments();

  const walletStats = await Wallet.aggregate([
    { $group: { _id: null, totalBalance: { $sum: "$balance" } } }
  ]);
  const systemLiability = walletStats[0]?.totalBalance || 0;

  const totalTransactions = await Transaction.countDocuments({ status: "SUCCESS" });

  // 2. Sales by Service (Pie Chart Data)
  const salesByService = await Transaction.aggregate([
    { $match: { status: "SUCCESS" } },
    { $group: { _id: "$serviceType", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
    { $project: { name: "$_id", value: "$revenue", count: 1, _id: 0 } }
  ]);

  // 3. Revenue over Time (Last 30 Days - Line Chart Data)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const revenueTrend = await Transaction.aggregate([
    { $match: { status: "SUCCESS", createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        profit: { $sum: { $ifNull: ["$profit", 0] } }
      }
    },
    { $sort: { "_id": 1 } },
    { $project: { date: "$_id", revenue: 1, profit: 1, _id: 0 } }
  ]);

  // 4. Recent Funding Activity
  const recentFunding = await WalletLog.find({ type: "CREDIT", reason: { $regex: /Funding/i } })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({ path: "walletId", populate: { path: "userId", select: "name email" } });

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        systemLiability,
        totalTransactions
      },
      salesByService,
      revenueTrend,
      recentFunding
    }
  });
});

