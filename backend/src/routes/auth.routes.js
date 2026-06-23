const router = require("express").Router();
const { adminSignup, login, logout, refresh } = require("../controllers/auth.controller");
const { validate } = require("../middlewares/validate.middleware");
const { adminSignupSchema, loginSchema } = require("../validators/auth.validators");

router.post("/admin/signup", validate({ body: adminSignupSchema }), adminSignup);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", logout);
router.post("/refresh", refresh);

module.exports = router;
