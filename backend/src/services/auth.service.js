const Organization = require("../models/organization.model");
const { User } = require("../models/user");
const { hashPassword, verifyPassword } = require("../utils/hash");
const { signAccessToken } = require("../utils/jwt");
const { createSession, rotateSession, revokeSession } = require("./session.service");
const { ApiError } = require("../utils/api-error");

const toPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const registerAdmin = async ({ name, email, password, orgName }) => {
  const existingOrg = await Organization.findOne({ name: orgName });
  if (existingOrg) {
    throw ApiError.conflict("Organization already exists");
  }

  const organization = await Organization.create({ name: orgName });

  const passwordHash = await hashPassword(password);

  const adminUser = await User.create({
    name,
    email,
    passwordHash,
    role: "ADMIN",
    organizationId: organization._id,
  });

  const accessToken = signAccessToken({
    userId: adminUser._id,
    orgId: organization._id,
    role: adminUser.role,
  });
  const refreshToken = await createSession(adminUser._id);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(adminUser),
    organization: { _id: organization._id, name: organization.name },
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).populate("organizationId");

  // Run the password check even when the user is missing to avoid leaking
  // which emails exist via response timing.
  const isValid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinv");

  if (!user || !isValid) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const accessToken = signAccessToken({
    userId: user._id,
    orgId: user.organizationId._id,
    role: user.role,
  });
  const refreshToken = await createSession(user._id);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
    organization: {
      _id: user.organizationId._id,
      name: user.organizationId.name,
    },
  };
};

const refreshSession = async (refreshToken) => {
  const { userId, rawToken } = await rotateSession(refreshToken);

  // No .populate() here — only the raw orgId is needed for the JWT payload,
  // matching the original refreshAccessToken behavior.
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const accessToken = signAccessToken({
    userId: user._id,
    orgId: user.organizationId,
    role: user.role,
  });

  return { accessToken, refreshToken: rawToken };
};

const logoutUser = async (refreshToken) => {
  await revokeSession(refreshToken);
};

module.exports = {
  registerAdmin,
  loginUser,
  refreshSession,
  logoutUser,
};
