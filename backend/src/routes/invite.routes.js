const router = require("express").Router();

const { requireAuth } = require("../middlewares/auth.middleware");
const requireAdmin = require("../middlewares/admin.middleware");

const { invite } = require("../controllers/invite.controller");

router.post("/", requireAuth, requireAdmin, invite);

module.exports = router;
