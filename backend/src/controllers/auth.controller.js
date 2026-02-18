const { registerAdmin } = require("../services/auth.service");

const adminSignup = async (req, res, next) => {
  try {
    const result = await registerAdmin(req.body);

    res.status(201).json({
      message: "Organization created. Admin registered.",
      data: result,
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminSignup,
};