import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import vtuRoutes from "./routes/vtu.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// ── Security ──────────────────────────────────────────────
app.use(helmet());

// Global Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", globalLimiter);

// Strict Auth Limiter (Login/Forgot Password)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 attempts
    message: "Too many login attempts, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);


const allowedOrigins = [
    "http://localhost:3000",
    ...(process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
        : []),
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
        },
        credentials: true,
    })
);

// ── Body Parsing ──────────────────────────────────────────
app.use(express.json());

// ── Routes ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/vtu", vtuRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhook", webhookRoutes);

// ── Global Error Handler (must be LAST) ───────────────────
app.use(errorHandler);

export default app;
