import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // 🔒 never return password by default
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    referredBy: {
      type: String,
      index: true,
    },


    resetOtp: {
      type: String,
      select: false,
    },

    resetOtpExpiry: {
      type: Date,
      select: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🎁 Generate unique referral code before saving new user
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.referralCode) {
    let code;
    let exists = true;
    while (exists) {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const user = await mongoose.models.User.findOne({ referralCode: code });
      if (!user) exists = false;
    }
    this.referralCode = code;
  }
  next();
});

/**
 * 🔐 Hash password before saving
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

/**
 * 🔑 Compare password helper
 */
userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
