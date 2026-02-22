const router = require("express").Router();
const {
  adminSignup,
  login,
  logout,
  refresh,
} = require("../controllers/auth.controller");

router.post("/admin/signup", adminSignup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);

module.exports = router;