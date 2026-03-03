import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name is too short"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        referredBy: z.string().optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
    }),
});

export const vtuPurchaseSchema = z.object({
    body: z.object({
        phone: z.string().regex(/^[0-9]{11}$/, "Invalid phone number (must be 11 digits)"),
        amount: z.number().positive("Amount must be positive"),
        network: z.string().min(1, "Network is required"),
        plan: z.string().optional(),
        examType: z.string().optional(),
        meterNumber: z.string().optional(),
    }),
});

export const fundWalletSchema = z.object({
    body: z.object({
        amount: z.coerce.number().min(100, "Minimum funding amount is ₦100"),
    }),
});

