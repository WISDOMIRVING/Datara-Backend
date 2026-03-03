import mongoose from "mongoose";

const walletLogSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", index: true, required: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true, index: true },
    reason: String,
    balanceBefore: Number,
    balanceAfter: Number

  },
  { timestamps: true }
);

export default mongoose.model("WalletLog", walletLogSchema);
