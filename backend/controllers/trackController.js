const Event = require("../models/Event");

// POST /api/track
exports.trackEvent = async (req, res, next) => {
  try {
    const { sessionId, event, data } = req.body;

    if (!sessionId || !event) {
      return res.status(400).json({
        message: "sessionId and event are required"
      });
    }

    await Event.create({
      sessionId,
      event,
      data
    });

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

// GET /api/track/:sessionId
exports.getSessionEvents = async (req, res, next) => {
  try {
    const events = await Event.find({
      sessionId: req.params.sessionId
    }).sort({ createdAt: 1 });

    res.json(events);
  } catch (err) {
    next(err);
  }
};

// GET /api/track
exports.getAllSessions = async (req, res, next) => {
  try {
    const sessions = await Event.distinct("sessionId");
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};
