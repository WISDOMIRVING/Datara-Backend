import mongoose from "mongoose";

const walletLogSchema = new mongoose.Schema(
  {
    walletId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    type: String,
    reason: String,
    balanceBefore: Number,
    balanceAfter: Number
  },
  { timestamps: true }
);

export default mongoose.model("WalletLog", walletLogSchema);
