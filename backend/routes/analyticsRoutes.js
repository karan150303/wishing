const express = require("express");
const router = express.Router();

const {
  trackEvent,
  getSessionTimeline,
  getVisitorHistory
} = require("../controllers/analyticsController");

router.post("/track", trackEvent);
router.get("/session/:id", getSessionTimeline);
router.get("/visitor/:id", getVisitorHistory);

module.exports = router;
