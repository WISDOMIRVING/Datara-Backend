import "./setup.js";
import request from "supertest";

import app from "../src/app.js";
import User from "../src/models/User.js";
import Wallet from "../models/Wallet.js";
import WalletLog from "../models/WalletLog.js";
import { jest } from "@jest/globals";

// Mock the Paystack service
jest.unstable_mockModule("../src/services/paystack.service.js", () => ({
    verifyPayment: jest.fn(),
}));

// Re-import after mocking
const { verifyPayment } = await import("../src/services/paystack.service.js");

describe("Wallet & Referral Integration Tests", () => {
    let user, token;

    const testUser = {
        name: "New User",
        email: "new@example.com",
        password: "Password123!",
    };

    beforeEach(async () => {
        // Setup a user and token
        const regRes = await request(app).post("/api/auth/register").send(testUser);
        user = regRes.body.user;

        const loginRes = await request(app).post("/api/auth/login").send({
            email: testUser.email,
            password: testUser.password
        });
        token = loginRes.body.token;
    });

    it("should initialize a funding request", async () => {
        const res = await request(app)
            .post("/api/wallet/init-fund")
            .set("Authorization", `Bearer ${token}`)
            .send({ amount: 500 });

        expect(res.statusCode).toBe(200);
        expect(res.body.authorization_url).toBeTruthy();
    });

    it("should credit wallet and award referral bonus on first funding", async () => {
        // 1. Create a referrer
        const referrer = await User.create({
            name: "Referrer",
            email: "ref@example.com",
            password: "Password123!",
            referralCode: "REF123"
        });
        await Wallet.create({ userId: referrer._id, balance: 0 });

        // 2. Register user with referral code
        const referredUserRes = await request(app).post("/api/auth/register").send({
            name: "Referred User",
            email: "referred@example.com",
            password: "Password123!",
            referredBy: "REF123"
        });
        const referredUserId = referredUserRes.body.user.id;

        const loginRes = await request(app).post("/api/auth/login").send({
            email: "referred@example.com",
            password: "Password123!"
        });
        const refToken = loginRes.body.token;

        // 3. Mock Paystack verification success
        verifyPayment.mockResolvedValue({
            data: {
                status: "success",
                amount: 100000, // ₦1000
                metadata: { userId: referredUserId }
            }
        });

        // 4. Trigger funding
        const fundRes = await request(app)
            .post("/api/wallet/fund")
            .set("Authorization", `Bearer ${refToken}`)
            .send({ reference: "ref_test_001" });

        expect(fundRes.statusCode).toBe(200);
        expect(fundRes.body.balance).toBe(1000);

        // 5. Verify Referral Bonus (₦100)
        const refWallet = await Wallet.findOne({ userId: referrer._id });
        expect(refWallet.balance).toBe(100);

        // 6. Verify Logs
        const creditLog = await WalletLog.findOne({ type: "CREDIT", reason: /Referral Bonus/ });
        expect(creditLog).toBeTruthy();
        expect(creditLog.amount).toBe(100);
    });
});
