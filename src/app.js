import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import vtuRoutes from "./routes/vtu.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/vtu", vtuRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhook", webhookRoutes);

export default app;
