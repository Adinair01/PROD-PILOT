const mongoose = require("mongoose");

const ROLES = ["QA", "FE", "BE", "DATA", "PM", "ADMIN"];

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
  },
  { timestamps: true }
);

// Unique email per org
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES };