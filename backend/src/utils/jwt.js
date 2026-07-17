const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
