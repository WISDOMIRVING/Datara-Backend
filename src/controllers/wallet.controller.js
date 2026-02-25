import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import { verifyPayment } from "../services/paystack.service.js";
import axios from "axios";

export const fundWallet = async (req, res) => {
  const payment = await verifyPayment(req.body.reference);
  if (!payment.data.status) return res.status(400).json({ message: "Failed" });

  const wallet = await Wallet.findOne({ userId: req.user.id });
  wallet.balance += payment.data.amount / 100;
  await wallet.save();

  res.json({ balance: wallet.balance });
};

export const getWalletBalance = async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user.id });
  res.json(wallet);
};

export const getUserTransactions = async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  res.json(transactions);
};

export const initFundWallet = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100, // Paystack expects kobo
        metadata: { userId },
        callback_url: `${process.env.FRONTEND_URL}/dashboard`,
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
      },
    );

    res.json({ authorization_url: response.data.data.authorization_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to initiate payment" });
  }
};
