const express = require("express");
const router = express.Router();

const {
  submitGiftResponse,
  getAllResponses
} = require("../controllers/giftController");

router.post("/respond", submitGiftResponse);
router.get("/all", getAllResponses);

module.exports = router;
