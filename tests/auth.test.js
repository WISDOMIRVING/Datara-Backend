import "./setup.js";
import request from "supertest";

import app from "../src/app.js";
import User from "../src/models/User.js";

describe("Authentication Integration Tests", () => {
    const testUser = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
    };

    it("should register a new user successfully", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe(testUser.email);

        // Verify user exists in DB
        const dbUser = await User.findOne({ email: testUser.email });
        expect(dbUser).toBeTruthy();
        expect(dbUser.referralCode).toBeTruthy();
    });

    it("should fail registration with existing email", async () => {
        await User.create(testUser);

        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("should login successfully and return a token", async () => {
        await request(app).post("/api/auth/register").send(testUser);

        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.user.email).toBe(testUser.email);
    });

    it("should reject login with wrong password", async () => {
        await User.create(testUser);

        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: "wrongpassword",
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
