const express = require("express");
const { requireAuth } = require("../middlewares/auth.middleware");
const { getContext, analyze } = require("../controllers/decision-engine.controller");

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET  /v1/decision-engine/context  — load org feedback summary
router.get("/context", getContext);

// POST /v1/decision-engine/analyze  — generate decision insight
router.post("/analyze", analyze);

module.exports = router;
