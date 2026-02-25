import express from "express";
import crypto from "crypto";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"])
      return res.sendStatus(400);

    // Parse the body after verification
    const eventData = JSON.parse(req.body.toString());
    const { event, data } = eventData;

    if (event === "charge.success") {
      const userId = data.metadata.userId;
      const wallet = await Wallet.findOne({ userId });
      wallet.balance += data.amount / 100;
      await wallet.save();

      await Transaction.create({
        userId,
        serviceType: "WALLET FUND",
        amount: data.amount / 100,
        status: "SUCCESS",
        reference: data.reference,
        apiResponse: data,
      });
    }

    res.sendStatus(200);
  },
);

export default router;
