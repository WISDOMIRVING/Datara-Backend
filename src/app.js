import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import vtuRoutes from "./routes/vtu.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// ── Security ──────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
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
