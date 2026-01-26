require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const analyticsRoutes = require("./routes/analyticsRoutes");
const giftRoutes = require("./routes/giftRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

// 🔴 REQUIRED FOR RENDER / PROXIES
app.set("trust proxy", true);

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

// Use Express trusted IP
function getClientIp(req) {
  return req.ip || "unknown";
}

// City-level GEO (best free accuracy)
async function getIpLocation(ip) {
  try {
    // Skip private / local IPs
    if (
      ip === "::1" ||
      ip.startsWith("127.") ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168")
    ) {
      return null;
    }

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp,org`);
    const data = await res.json();

    if (data.status !== "success") return null;

    return {
      city: data.city,
      region: data.regionName,
      country: data.country,
      latitude: data.lat,
      longitude: data.lon,
      isp: data.isp || data.org
    };
  } catch {
    return null;
  }
}

// ================= VISITOR LOGGING (PRODUCTION) =================
const loggedIPs = new Map();

app.use(async (req, res, next) => {
  // ✅ Only log REAL page visits
  if (req.method !== "GET" || req.path !== "/") return next();

  const ip = getClientIp(req);

  // ⛔ Deduplicate (10 minutes)
  const now = Date.now();
  if (loggedIPs.has(ip) && now - loggedIPs.get(ip) < 10 * 60 * 1000) {
    return next();
  }
  loggedIPs.set(ip, now);

  const userAgent = req.headers["user-agent"] || "unknown";
  const referrer = req.headers["referer"] || "direct";
  const visitorName = getVisitorLabel(userAgent);

  const time = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata"
  });

  const location = await getIpLocation(ip);

  console.log(`
[REAL VISITOR]
Name      : ${visitorName}
IP        : ${ip}
City      : ${location?.city || "Unavailable"}
Region    : ${location?.region || "Unavailable"}
Country   : ${location?.country || "Unavailable"}
Latitude  : ${location?.latitude ?? "N/A"}
Longitude : ${location?.longitude ?? "N/A"}
ISP       : ${location?.isp || "Unavailable"}
Time      : ${time}
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
