const Organization = require("../models/organization.model");
const { User } = require("../models/user");
const hashPassword = require("../utils/hash");
const generateToken = require("../utils/jwt");

const registerAdmin = async ({ name, email, password, orgName }) => {

  const existingOrg = await Organization.findOne({ name: orgName });

  if (existingOrg) {
    const error = new Error("Organization already exists");
error.statusCode = 409;
throw error;
  }

  // create org
  const organization = await Organization.create({
    name: orgName,
  });

  // hash password
  const passwordHash = await hashPassword(password);

  // create admin
  const adminUser = await User.create({
    name,
    email,
    passwordHash,
    role: "ADMIN",
    organizationId: organization._id,
  });

  // jwt
  const token = generateToken({
    userId: adminUser._id,
    orgId: organization._id,
    role: adminUser.role,
  });

  return {
    token,
    user: adminUser,
    organization,
  };
};

module.exports = {
  registerAdmin,
};