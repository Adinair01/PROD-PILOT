const router = require("express").Router();
const { adminSignup } = require("../controllers/auth.controller");

router.post("/admin/signup", adminSignup);


module.exports = router;