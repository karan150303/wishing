const Event = require("../models/Event");

exports.createEvent = async (payload) => {
  return Event.create(payload);
};

exports.getSessionTimeline = async (sessionId) => {
  return Event.find({ sessionId }).sort({ timestamp: 1 });
};

exports.getVisitorHistory = async (visitorId) => {
  return Event.find({ visitorId }).sort({ timestamp: 1 });
};

exports.getAllSessions = async () => {
  return Event.distinct("sessionId");
};
