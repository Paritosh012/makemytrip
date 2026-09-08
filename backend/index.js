require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const {
  apiLimiter,
  paymentLimiter,
} = require("./middlewares/rateLimiter.middleware");

const connectDB = require("./config/db");

// ROUTES
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const hostApplicationRoutes = require("./routes/host.application.routes");
const packageRoutes = require("./routes/package.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");

const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

/*
-------------------------------------------------------
SECURITY + MIDDLEWARE
-------------------------------------------------------
*/

const allowedOrigins = [
  "http://localhost:5173", // ✅ dev
  "http://localhost:3000", // ✅ dev alt
  "https://makemytrip-frontend-kvdy.onrender.com", // ✅ production
  process.env.FRONTEND_URL, // ✅ production (from Render env)
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS")); // ❌ block
      }
    },
    credentials: true,
  }),
);

// Behind Render's proxy, so req.ip must come from X-Forwarded-For.
// Without this every request shares the proxy's IP and one user's failed
// logins would rate-limit the entire site.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

/*
-------------------------------------------------------
HEALTH CHECK
-------------------------------------------------------
*/
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    environment: process.env.NODE_ENV || "development",
  });
});

/*
-------------------------------------------------------
ROUTES
-------------------------------------------------------
*/

// Blunt catch-all against scrapers. Per-endpoint limits live in the route
// files themselves, which is where they are visible to whoever edits them.
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);

// NO limiter on normal app routes
app.use("/api/admin", adminRoutes);
app.use("/api/host-applications", hostApplicationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/bookings", bookingRoutes);

// Optional limiter for payments
app.use("/api/payments", paymentLimiter, paymentRoutes);

/*
-------------------------------------------------------
ERROR HANDLER
-------------------------------------------------------
*/
app.use(errorMiddleware);
/*
-------------------------------------------------------
SERVER START
-------------------------------------------------------
*/
const PORT = process.env.PORT || 5000;

// Only connect + listen when run directly (node index.js).
// When Jest require()s this file, skip both so tests don't hang
// on an open DB connection or try to bind a port.
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("DB connection failed:", err);
      process.exit(1);
    });
}

module.exports = app;
