const Organization = require("../models/organization.model");
const { User } = require("../models/user");
const { hashPassword, verifyPassword } = require("../utils/hash");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

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
  const accessToken = signAccessToken({
    userId: adminUser._id,
    orgId: organization._id,
    role: adminUser.role,
  });

  const refreshToken = signRefreshToken({
    userId: adminUser._id,
  });

  return {
    accessToken,
    refreshToken,
    user: adminUser,
    organization,
  };
};

module.exports = {
  registerAdmin,
};

const loginUser = async ({ email, password }) => {
  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  // Generate tokens
  const accessToken = signAccessToken({
    userId: user._id,
    orgId: user.organizationId,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    userId: user._id,
  });

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const newAccessToken = signAccessToken({
      userId: user._id,
      orgId: user.organizationId,
      role: user.role,
    });

    return { accessToken: newAccessToken };
  } catch (err) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }
};

module.exports = {
  registerAdmin,
  loginUser,
  refreshAccessToken,
};
