const { z } = require("zod");     //Zod validates data to ensure it's in the correct format. It prevents bad data from reaching your database.
const { ROLES } = require("../models/user");

const registerSchema = z.object({
  orgId: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES),
});

const loginSchema = z.object({
  orgId: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

module.exports = { registerSchema, loginSchema };