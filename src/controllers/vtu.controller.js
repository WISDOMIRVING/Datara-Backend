import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import {
  buyAirtime,
  buyData,
  payElectricity,
  subscribeCable,
  buyExamPin,
} from "../services/vtu.service.js";

const processVTU = async ({
  userId,
  amount,
  serviceType,
  handler,
  payload,
}) => {
  const wallet = await Wallet.findOne({ userId });

  if (wallet.balance < amount) throw new Error("Insufficient balance");

  wallet.balance -= amount;
  wallet.lockedBalance += amount;
  await wallet.save();

  let response;
  try {
    response = await handler(payload);

    wallet.lockedBalance -= amount;
    await wallet.save();

    await Transaction.create({
      userId,
      serviceType,
      amount,
      status: "SUCCESS",
      apiResponse: response,
    });

    return response;
  } catch (err) {
    wallet.balance += amount;
    wallet.lockedBalance -= amount;
    await wallet.save();

    await Transaction.create({
      userId,
      serviceType,
      amount,
      status: "FAILED",
      apiResponse: err.message,
    });

    throw err;
  }
};

export const airtime = async (req, res) => {
  const response = await processVTU({
    userId: req.user.id,
    amount: req.body.amount,
    serviceType: "AIRTIME",
    handler: buyAirtime,
    payload: req.body,
  });
  res.json(response);
};

export const data = async (req, res) => {
  const response = await processVTU({
    userId: req.user.id,
    amount: req.body.amount,
    serviceType: "DATA",
    handler: buyData,
    payload: req.body,
  });
  res.json(response);
};

export const electricity = async (req, res) => {
  const response = await processVTU({
    userId: req.user.id,
    amount: req.body.amount,
    serviceType: "ELECTRICITY",
    handler: payElectricity,
    payload: req.body,
  });
  res.json(response);
};

export const cable = async (req, res) => {
  const response = await processVTU({
    userId: req.user.id,
    amount: req.body.amount,
    serviceType: "CABLE",
    handler: subscribeCable,
    payload: req.body,
  });
  res.json(response);
};

export const exam = async (req, res) => {
  const response = await processVTU({
    userId: req.user.id,
    amount: req.body.amount,
    serviceType: "EXAM",
    handler: buyExamPin,
    payload: req.body,
  });
  res.json(response);
};
