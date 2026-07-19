const Organization = require("../models/organization.model");
const { User } = require("../models/user");
const Feedback = require("../models/feedback.model");
const DecisionHistory = require("../models/decision-history.model");
const { RefreshToken } = require("../models/refresh-token.model");
const { PasswordResetToken } = require("../models/password-reset-token.model");
const { hashPassword, verifyPassword } = require("../utils/hash");
const { signAccessToken } = require("../utils/jwt");
const { createSession, rotateSession, revokeSession } = require("./session.service");
const { verifyGoogleIdToken } = require("../utils/google-auth");
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
  // which emails exist via response timing. Also guards Google-only accounts
  // (no passwordHash) — falls through to the dummy-hash compare instead of
  // passing undefined to bcrypt, which would throw.
  const isValid = user?.passwordHash
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

const googleSignup = async ({ idToken, orgName }) => {
  const { googleId, email, name } = await verifyGoogleIdToken(idToken);

  // Checked before touching Organization at all — googleId is globally
  // unique (unlike {organizationId, email}, which can't collide for a
  // brand-new org), so a repeat signup by an already-registered identity
  // would otherwise create-then-abandon an Organization document when
  // User.create fails on the duplicate-key error.
  const existingUser = await User.findOne({ googleId });
  if (existingUser) {
    throw ApiError.conflict(
      "An account already exists for this Google identity. Please sign in instead."
    );
  }

  const existingOrg = await Organization.findOne({ name: orgName });
  if (existingOrg) {
    throw ApiError.conflict("Organization already exists");
  }

  const organization = await Organization.create({ name: orgName });
  const adminUser = await User.create({
    name,
    email,
    googleId,
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

const googleLogin = async ({ idToken }) => {
  const { googleId, email } = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({ googleId }).populate("organizationId");

  // Fall back to linking an existing password account by email. Safe to do
  // silently because Google already verified the caller owns this email
  // (email_verified checked in verifyGoogleIdToken) — same trust level as a
  // password reset link. Same multi-org ambiguity as loginUser's email
  // lookup if the address exists in more than one org; accepted there too.
  if (!user) {
    user = await User.findOne({ email, googleId: { $exists: false } }).populate("organizationId");
    if (user) {
      user.googleId = googleId;
      await user.save();
    }
  }

  if (!user) {
    throw ApiError.unauthorized("No account found for this Google identity");
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
    organization: { _id: user.organizationId._id, name: user.organizationId.name },
  };
};

/**
 * Deletes the requesting user's own account. If they're the last user in
 * their org, the whole org (and its org-scoped data — feedback, decision
 * history) is torn down too; otherwise only their own user record and
 * sessions are removed, leaving shared org data for remaining teammates.
 */
const deleteAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("Account not found");
  }

  const remainingInOrg = await User.countDocuments({
    organizationId: user.organizationId,
    _id: { $ne: user._id },
  });

  await User.deleteOne({ _id: user._id });
  await RefreshToken.deleteMany({ userId: user._id });
  await PasswordResetToken.deleteMany({ userId: user._id });

  if (remainingInOrg === 0) {
    await Organization.deleteOne({ _id: user.organizationId });
    await Feedback.deleteMany({ organizationId: user.organizationId });
    await DecisionHistory.deleteMany({ organizationId: user.organizationId });
  }
};

module.exports = {
  registerAdmin,
  loginUser,
  refreshSession,
  logoutUser,
  googleSignup,
  googleLogin,
  deleteAccount,
};
