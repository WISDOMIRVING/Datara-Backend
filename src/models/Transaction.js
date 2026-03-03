import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  serviceType: String,
  network: String,
  amount: Number,
  costPrice: Number,
  profit: Number,
  status: { type: String, default: "PENDING" },
  reference: { type: String, index: true },

  apiResponse: Object
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
