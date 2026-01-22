const GiftResponse = require("../models/GiftResponse");

// POST /api/gift/respond
exports.submitGiftResponse = async (req, res, next) => {
  try {
    const { visitorId, sessionId, coffeeResponse, coupon } = req.body;

    if (!visitorId || !sessionId || !coffeeResponse) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await GiftResponse.findOne({ visitorId, sessionId });
    if (existing) {
      return res.status(200).json({ message: "Response already recorded" });
    }

    let safeCoupon = undefined;
    if (coupon) {
      safeCoupon = {
        code: coupon.code || coupon.type || "GIFT",
        description:
          coupon.description ||
          (coupon.contactMethod ? `Contact via ${coupon.contactMethod}` : ""),
        value: coupon.value || 0,
        contactMethod: coupon.contactMethod,
        contact: coupon.contact
      };
    }

    await GiftResponse.create({
      visitorId,
      sessionId,
      coffeeResponse,
      coupon: safeCoupon
    });

    res.status(201).json({ message: "Response saved" });
  } catch (err) {
    next(err);
  }
};

// ✅ THIS EXPORT MUST EXIST
exports.getAllResponses = async (req, res, next) => {
  try {
    const responses = await GiftResponse.find().sort({ createdAt: -1 });
    res.json(responses);
  } catch (err) {
    next(err);
  }
};
