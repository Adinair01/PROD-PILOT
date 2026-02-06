const { User } = require("../models/user");
const { hashPassword, verifyPassword } = require("../utils/hash");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

async function register({ orgId, name, email, password, role }) {
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    orgId,
    name,
    email,
    passwordHash,
    role,
  });

  return {
    id: user._id.toString(),
    orgId: user.orgId,
    role: user.role,
    email: user.email,
    name: user.name,
  };
}

async function login({ orgId, email, password }) {
  const user = await User.findOne({ orgId, email });
  if (!user) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });

  const payload = { sub: user._id.toString(), orgId: user.orgId, role: user.role };

  return {
    user: {
      id: user._id.toString(),
      orgId: user.orgId,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

async function refresh(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const payload = { sub: decoded.sub, orgId: decoded.orgId, role: decoded.role };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

module.exports = { register, login, refresh };