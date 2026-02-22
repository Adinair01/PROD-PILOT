const router = require("express").Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const { getInsights } = require("../controllers/insights.controller");

router.get("/", requireAuth, getInsights);

module.exports = router;