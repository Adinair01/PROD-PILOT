const router = require("express").Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const { getInsights } = require("../controllers/analytics.controller");

router.get("/", requireAuth, getInsights);

module.exports = router;