require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const analyticsRoutes = require("./routes/analyticsRoutes");
const giftRoutes = require("./routes/giftRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

// ================= DB =================
connectDB();

// ================= MIDDLEWARES =================
app.use(cors());
app.use(express.json());

// ================= VISITOR HELPERS =================
function getVisitorLabel(userAgent = "") {
  let platform = "Browser";
  let device = "Unknown";
  let os = "Unknown OS";

  if (/instagram/i.test(userAgent)) platform = "Instagram";
  else if (/facebook/i.test(userAgent)) platform = "Facebook";
  else if (/chrome/i.test(userAgent)) platform = "Chrome";
  else if (/safari/i.test(userAgent)) platform = "Safari";

  if (/iphone/i.test(userAgent)) device = "iPhone";
  else if (/android/i.test(userAgent)) device = "Android";
  else if (/windows/i.test(userAgent)) device = "Windows PC";
  else if (/macintosh/i.test(userAgent)) device = "Mac";

  if (/ios|iphone|ipad/i.test(userAgent)) os = "iOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/windows/i.test(userAgent)) os = "Windows";
  else if (/mac os/i.test(userAgent)) os = "macOS";

  return `${platform} • ${device} • ${os}`;
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

async function getIpLocation(ip) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();

    return {
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country_name || "Unknown",
      latitude: data.latitude || "N/A",
      longitude: data.longitude || "N/A",
      isp: data.org || "Unknown ISP"
    };
  } catch (err) {
    return {
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      latitude: "N/A",
      longitude: "N/A",
      isp: "Unknown ISP"
    };
  }
}

// ================= VISITOR LOGGING =================
app.use(async (req, res, next) => {
  // Skip health checks to avoid spam
  if (req.path === "/health") return next();

  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";
  const referrer = req.headers["referer"] || "direct";

  const time = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata"
  });

  const visitorName = getVisitorLabel(userAgent);
  const location = await getIpLocation(ip);

  console.log(`
[VISITOR LOG]
Name      : ${visitorName}
IP        : ${ip}
City      : ${location.city}
Region    : ${location.region}
Country   : ${location.country}
Latitude  : ${location.latitude}
Longitude : ${location.longitude}
ISP       : ${location.isp}
Time      : ${time}
Request   : ${req.method} ${req.originalUrl}
Referrer  : ${referrer}
---------------------------------------
`);

  next();
});

// ================= FRONTEND =================
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// ================= API ROUTES =================
app.use("/api/analytics", analyticsRoutes);
app.use("/api/gift", giftRoutes);

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// ================= ROOT =================
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ================= ERROR HANDLER =================
app.use(errorMiddleware);

module.exports = app;
