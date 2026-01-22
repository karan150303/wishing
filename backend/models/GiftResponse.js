const mongoose = require("mongoose");

const GiftResponseSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true
  },

  coffeeResponse: {
    type: String,
    enum: ["yes", "no"],
    required: true
  },

  coupon: {
    code: String,
    description: String,
    value: Number,

    // ✅ ADD THESE
    contactMethod: String,
    contact: String
    },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("GiftResponse", GiftResponseSchema);
