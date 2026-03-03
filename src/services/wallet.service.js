import Wallet from "../models/Wallet.js";
import WalletLog from "../models/WalletLog.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import sendEmail from "../utils/sendEmail.js";
import { fundingTemplate } from "../utils/emailTemplates.js";

/**
 * Atomicly credit a wallet, log the event, and pay referral bonuses.
 */
export const creditWallet = async ({ userId, amount, reference, apiResponse }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Credit the wallet atomicly
        const wallet = await Wallet.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { new: true, session, upsert: true } // Upsert in case wallet doc doesn't exist
        );

        const balanceAfter = wallet.balance;

        // 2. Create Wallet Audit Log
        await WalletLog.create([{
            walletId: wallet._id,
            amount: amount,
            type: "CREDIT",
            reason: `Wallet Funding (Ref: ${reference})`,
            balanceBefore: balanceAfter - amount,
            balanceAfter: balanceAfter
        }], { session });

        // 3. Create Public Transaction Record
        await Transaction.create([{
            userId,
            serviceType: "WALLET FUND",
            amount,
            status: "SUCCESS",
            reference,
            apiResponse
        }], { session });

        // 4. Referral Bonus Logic
        const user = await User.findById(userId).session(session);
        if (user && user.referredBy) {
            // Check if this is the user's first successful funding
            // We look for CREDIT logs for this wallet that are older than current or just count
            const creditLogCount = await WalletLog.countDocuments({
                walletId: wallet._id,
                type: "CREDIT",
                reason: { $regex: /Funding/i }
            }).session(session);

            // If count is 1, it means the one we just created is the first one
            if (creditLogCount === 1) {
                const referrer = await User.findOne({ referralCode: user.referredBy }).session(session);
                if (referrer) {
                    const bonusAmount = 100;
                    const refWallet = await Wallet.findOneAndUpdate(
                        { userId: referrer._id },
                        { $inc: { balance: bonusAmount } },
                        { new: true, session, upsert: true }
                    );

                    await WalletLog.create([{
                        walletId: refWallet._id,
                        amount: bonusAmount,
                        type: "CREDIT",
                        reason: `Referral Bonus: ${user.name}'s first funding`,
                        balanceBefore: refWallet.balance - bonusAmount,
                        balanceAfter: refWallet.balance
                    }], { session });

                    logger.info(`Referral bonus of ₦${bonusAmount} awarded to ${referrer.email} for ${user.email}`);
                }
            }
        }

        await session.commitTransaction();

        // 5. Async Email Notification (Outside transaction)
        if (user) {
            sendEmail({
                to: user.email,
                subject: "Wallet Funded Successfully",
                html: fundingTemplate(amount, balanceAfter),
            }).catch(err => logger.error("Funding Email Failed", { err, userId }));
        }

        return wallet;
    } catch (err) {
        await session.abortTransaction();
        logger.error("Wallet Credit Transaction Failed", { err, userId, reference });
        throw err;
    } finally {
        session.endSession();
    }
};
