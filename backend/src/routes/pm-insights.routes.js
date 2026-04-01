const router = require("express").Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const { getPMInsights } = require("../controllers/pm-insights.controller");

router.get("/", requireAuth, getPMInsights);

module.exports = router;
