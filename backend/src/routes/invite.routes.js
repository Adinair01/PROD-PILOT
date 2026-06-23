const router = require("express").Router();

const { requireAuth } = require("../middlewares/auth.middleware");
const requireAdmin = require("../middlewares/admin.middleware");
const { validate } = require("../middlewares/validate.middleware");
const { inviteUserSchema } = require("../validators/invite.validators");
const { invite } = require("../controllers/invite.controller");

router.post("/", requireAuth, requireAdmin, validate({ body: inviteUserSchema }), invite);

module.exports = router;
