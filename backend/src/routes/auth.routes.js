const router = require("express").Router();
const {
  adminSignup,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  googleSignup,
  googleLogin,
  deleteAccount,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  adminSignupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleSignupSchema,
  googleLoginSchema,
} = require("../validators/auth.validators");

router.post("/admin/signup", validate({ body: adminSignupSchema }), adminSignup);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/forgot-password", validate({ body: forgotPasswordSchema }), forgotPassword);
router.post("/reset-password", validate({ body: resetPasswordSchema }), resetPassword);
router.post("/google/signup", validate({ body: googleSignupSchema }), googleSignup);
router.post("/google/login", validate({ body: googleLoginSchema }), googleLogin);
router.delete("/account", requireAuth, deleteAccount);

module.exports = router;
