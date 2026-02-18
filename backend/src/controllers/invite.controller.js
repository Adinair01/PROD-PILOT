const { inviteUser } = require("../services/invite.service");

const invite = async (req, res, next) => {
  try {
    const result = await inviteUser(req.user, req.body);

    res.status(201).json({
      message: "User invited",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { invite };