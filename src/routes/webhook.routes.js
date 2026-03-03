import express from "express";
import crypto from "crypto";
import { creditWallet } from "../services/wallet.service.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        return res.sendStatus(400);
      }

      const eventData = JSON.parse(req.body.toString());
      const { event, data } = eventData;

      if (event === "charge.success") {
        logger.info(`Paystack Webhook: Received success for ${data.reference}`);

        await creditWallet({
          userId: data.metadata.userId,
          amount: data.amount / 100,
          reference: data.reference,
          apiResponse: data
        });
      }

      res.sendStatus(200);
    } catch (err) {
      logger.error("Paystack Webhook Error", { err, body: req.body.toString() });
      res.sendStatus(500);
    }
  },
);


export default router;
