import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import ServicePricing from "../models/ServicePricing.js";

export const users = async (req, res) => {
  res.json(await User.find());
};

export const transactions = async (req, res) => {
  res.json(await Transaction.find().sort({ createdAt: -1 }));
};

export const updatePricing = async (req, res) => {
  const pricing = await ServicePricing.findByIdAndUpdate(
    req.body.id,
    req.body,
    { new: true }
  );
  res.json(pricing);
};

export const refund = async (req, res) => {
  const tx = await Transaction.findById(req.body.transactionId);
  tx.status = "REFUNDED";
  await tx.save();
  res.json({ message: "Refund completed" });
};
