import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import sendEmail from "../utils/sendEmail.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({ name, email, password, role: "USER" });

  await Wallet.create({ userId: user._id, balance: 0 });

  res.status(201).json({
    success: true,
    message: "Registered successfully",
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const wallet = await Wallet.findOne({ userId: user._id });

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    wallet: wallet ? { balance: wallet.balance } : { balance: 0 },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, "Email already in use");
    }
    user.email = email;
  }

  if (name) user.name = name;
  await user.save();

  res.json({
    success: true,
    message: "Profile updated",
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new passwords are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password changed successfully" });
});

// ─── Forgot Password: send OTP ───────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether the email exists
    return res.json({
      success: true,
      message: "If that email is registered, you will receive an OTP shortly",
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOtp = otp;
  user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // Send OTP email
  try {
    await sendEmail({
      to: user.email,
      subject: "Datara - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1e3a8a; margin-bottom: 16px;">Password Reset</h2>
          <p style="color: #374151; margin-bottom: 16px;">
            Hi ${user.name}, you requested a password reset. Use the OTP code below to proceed:
          </p>
          <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">— Datara Team</p>
        </div>
      `,
    });
    console.log(`✅ OTP email sent to ${user.email}`);
  } catch (emailErr) {
    console.error("⚠️ Email sending failed:", emailErr.message);
    console.log(`📌 DEV FALLBACK — OTP for ${user.email}: ${otp}`);
    // Don't throw — the OTP is saved in DB, user can get it from console in dev
  }

  res.json({
    success: true,
    message: "If that email is registered, you will receive an OTP shortly",
  });
});

// ─── Verify OTP ──────────────────────────────────────────────────────────────
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email }).select("+resetOtp +resetOtpExpiry");
  if (!user || !user.resetOtp) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (user.resetOtp !== otp) {
    throw new ApiError(400, "Invalid OTP code");
  }

  if (user.resetOtpExpiry < new Date()) {
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();
    throw new ApiError(400, "OTP has expired. Please request a new one");
  }

  res.json({
    success: true,
    message: "OTP verified successfully",
  });
});

// ─── Reset Password ──────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP, and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await User.findOne({ email }).select("+resetOtp +resetOtpExpiry +password");
  if (!user || !user.resetOtp) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (user.resetOtp !== otp) {
    throw new ApiError(400, "Invalid OTP code");
  }

  if (user.resetOtpExpiry < new Date()) {
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();
    throw new ApiError(400, "OTP has expired. Please request a new one");
  }

  // Update password and clear OTP
  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully. You can now log in.",
  });
});
