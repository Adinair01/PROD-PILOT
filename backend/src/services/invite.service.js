const crypto = require("crypto");
const { User } = require("../models/user");
const { hashPassword } = require("../utils/hash");
const { ApiError } = require("../utils/api-error");

/**
 * Generates a strong, URL-safe one-time password for an invited user.
 * Returned once to the inviting admin to share out of band; the user should
 * reset it on first login.
 */
function generateTempPassword() {
  return crypto.randomBytes(12).toString("base64url"); // ~16 chars, high entropy
}

const inviteUser = async (adminUser, { name, email, role }) => {
  if (role === "ADMIN") {
    throw ApiError.badRequest("Cannot invite another admin");
  }

  const existing = await User.findOne({
    email,
    organizationId: adminUser.orgId,
  });
  if (existing) {
    throw ApiError.conflict("User already exists in this organization");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const newUser = await User.create({
    name,
    email,
    passwordHash,
    role,
    organizationId: adminUser.orgId,
  });

  return {
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
    tempPassword,
  };
};

module.exports = { inviteUser };
