const { User } = require("../models/user");
const { hashPassword } = require("../utils/hash");

const inviteUser = async (adminUser, { name, email, role }) => {

  if (role === "ADMIN") {
    throw new Error("Cannot invite another admin");
  }

  const existing = await User.findOne({
    email,
    organizationId: adminUser.orgId,
  });

  if (existing) {
    throw new Error("User already exists in this organization");
  }

  const tempPassword = "Temp@1234";

  const passwordHash = await hashPassword(tempPassword);

  const newUser = await User.create({
    name,
    email,
    passwordHash,
    role,
    organizationId: adminUser.orgId,
  });

  return {
    user: newUser,
    tempPassword,
  };
};

module.exports = { inviteUser };