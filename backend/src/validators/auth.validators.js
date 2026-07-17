const { z } = require("zod");

// Admin signup bootstraps a new organization + its first (ADMIN) user.
const adminSignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  orgName: z.string().trim().min(2, "Organization name must be at least 2 characters").max(120),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required").max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

module.exports = { adminSignupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
