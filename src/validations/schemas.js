import { z } from "zod";

// ── Auth Schemas ──────────────────────────────────────────────────────────────

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

// ── Wallet Schemas ────────────────────────────────────────────────────────────

export const fundWalletSchema = z.object({
    body: z.object({
        amount: z.coerce.number().min(100, "Minimum funding amount is ₦100"),
    }),
});

// ── VTU Schemas (Per-Endpoint) ────────────────────────────────────────────────

const phoneField = z.string().regex(/^0[789][01]\d{8}$/, "Invalid Nigerian phone number (must be 11 digits starting with 070/080/081/090/091)");

const networkEnum = z.enum(["MTN", "GLO", "AIRTEL", "9MOBILE", "mtn", "glo", "airtel", "9mobile"], {
    errorMap: () => ({ message: "Network must be one of: MTN, GLO, AIRTEL, 9MOBILE" }),
});

export const airtimeSchema = z.object({
    body: z.object({
        phone: phoneField,
        amount: z.coerce.number().min(50, "Minimum airtime amount is ₦50").max(50000, "Maximum airtime amount is ₦50,000"),
        network: networkEnum,
    }),
});

export const dataSchema = z.object({
    body: z.object({
        phone: phoneField,
        amount: z.coerce.number().positive("Amount must be positive"),
        network: networkEnum,
        plan: z.string().min(1, "Data plan is required"),
    }),
});

export const electricitySchema = z.object({
    body: z.object({
        meterNumber: z.string().regex(/^\d{11,13}$/, "Meter number must be 11-13 digits"),
        disco: z.string().min(1, "Disco (distribution company) is required"),
        amount: z.coerce.number().min(500, "Minimum electricity payment is ₦500").max(500000, "Maximum electricity payment is ₦500,000"),
        meterType: z.enum(["prepaid", "postpaid"], {
            errorMap: () => ({ message: "Meter type must be 'prepaid' or 'postpaid'" }),
        }).optional(),
    }),
});

export const cableSchema = z.object({
    body: z.object({
        iucNumber: z.string().regex(/^\d{10,}$/, "IUC/Smartcard number must be at least 10 digits"),
        provider: z.enum(["dstv", "gotv", "startimes", "DSTV", "GOTV", "STARTIMES"], {
            errorMap: () => ({ message: "Provider must be one of: DSTV, GOTV, STARTIMES" }),
        }),
        plan: z.string().min(1, "Cable plan/bouquet is required"),
        amount: z.coerce.number().positive("Amount must be positive"),
    }),
});

export const examSchema = z.object({
    body: z.object({
        examType: z.enum(["WAEC", "NECO", "NABTEB", "waec", "neco", "nabteb"], {
            errorMap: () => ({ message: "Exam type must be one of: WAEC, NECO, NABTEB" }),
        }),
        amount: z.coerce.number().positive("Amount must be positive"),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(10, "Maximum 10 pins per purchase").optional(),
    }),
});
