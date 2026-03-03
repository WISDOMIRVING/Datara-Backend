import "./setup.js";
import request from "supertest";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import { jest } from "@jest/globals";

// Mock the VTU service
jest.unstable_mockModule("../src/services/vtu.service.js", () => ({
    buyAirtime: jest.fn(),
    buyData: jest.fn(),
}));

const { buyAirtime } = await import("../src/services/vtu.service.js");

describe("VTU Integration Tests", () => {
    let user, token, wallet;

    beforeEach(async () => {
        const regRes = await request(app).post("/api/auth/register").send({
            name: "VTU User",
            email: "vtu@example.com",
            password: "Password123!",
        });
        user = regRes.body.user;

        const loginRes = await request(app).post("/api/auth/login").send({
            email: "vtu@example.com",
            password: "Password123!"
        });
        token = loginRes.body.token;

        // Credit wallet with ₦1000
        wallet = await Wallet.findOneAndUpdate(
            { userId: user.id },
            { $set: { balance: 1000 } },
            { new: true, upsert: true }
        );
    });

    it("should process airtime purchase successfully", async () => {
        buyAirtime.mockResolvedValue({ status: "success", reference: "vtu_ref_123" });

        const res = await request(app)
            .post("/api/vtu/airtime")
            .set("Authorization", `Bearer ${token}`)
            .send({ amount: 100, phone: "08012345678", network: "MTN" });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify balance was debited
        const updatedWallet = await Wallet.findOne({ userId: user.id });
        expect(updatedWallet.balance).toBe(900);

        // Verify transaction record
        const tx = await Transaction.findOne({ userId: user.id, serviceType: "AIRTIME" });
        expect(tx.status).toBe("SUCCESS");
    });

    it("should rollback wallet balance on VTU provider failure", async () => {
        buyAirtime.mockRejectedValue(new Error("VTU Provider Down"));

        const res = await request(app)
            .post("/api/vtu/airtime")
            .set("Authorization", `Bearer ${token}`)
            .send({ amount: 100, phone: "08012345678", network: "MTN" });

        expect(res.statusCode).toBe(500);

        // Verify balance was ROLLED BACK (should still be 1000)
        const updatedWallet = await Wallet.findOne({ userId: user.id });
        expect(updatedWallet.balance).toBe(1000);

        // Verify failed transaction record
        const tx = await Transaction.findOne({ userId: user.id, status: "FAILED" });
        expect(tx).toBeTruthy();
    });

    it("should reject purchase if balance is insufficient", async () => {
        const res = await request(app)
            .post("/api/vtu/airtime")
            .set("Authorization", `Bearer ${token}`)
            .send({ amount: 5000, phone: "08012345678", network: "MTN" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Insufficient balance/i);
    });
});
