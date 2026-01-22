const express = require("express");
const router = express.Router();

const {
  trackEvent,
  getSessionEvents,
  getAllSessions
} = require("../controllers/trackController");

router.post("/", trackEvent);
router.get("/", getAllSessions);
router.get("/:sessionId", getSessionEvents);

module.exports = router;
