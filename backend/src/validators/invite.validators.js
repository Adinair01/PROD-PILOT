const { z } = require("zod");
const { ROLES } = require("../models/user");

// Admins may invite any role except another ADMIN.
const invitableRoles = ROLES.filter((r) => r !== "ADMIN");

const inviteUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(invitableRoles),
});

module.exports = { inviteUserSchema };
