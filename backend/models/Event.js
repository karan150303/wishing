const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  // Identity
  visitorId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  pageInstanceId: {
    type: String,
    required: true,
    index: true
  },

  // Context
  referrer: {
    type: String,
    default: "direct"
  },
  entryType: {
    type: String
  },
  url: {
    type: String
  },

  // Environment
  userAgent: {
    type: String
  },
  screen: {
    w: Number,
    h: Number,
    dpr: Number
  },

  // Event
  event: {
    type: String,
    required: true,
    index: true
  },
  meta: {
    type: Object,
    default: {}
  },

  // Time
  timestamp: {
    type: Number,
    required: true,
    index: true
  }
});

// Helpful compound indexes (analytics-friendly)
EventSchema.index({ visitorId: 1, timestamp: -1 });
EventSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model("Event", EventSchema);
