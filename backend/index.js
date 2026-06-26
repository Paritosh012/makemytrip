require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

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
        callback(null, true); // ✅ allow
      } else {
        callback(new Error("Not allowed by CORS")); // ❌ block
      }
    },
    credentials: true,
  }),
);

// 🔥 Rate limit (general)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// 🔥 Stricter limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

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

// AUTH (no limiter on /me)
app.use("/api/auth", authRoutes);

// Apply limiter ONLY to sensitive endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/verify-otp", authLimiter);

// NO limiter on normal app routes
app.use("/api/admin", adminRoutes);
app.use("/api/host-applications", hostApplicationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/bookings", bookingRoutes);

// Optional limiter for payments
app.use("/api/payments", globalLimiter, paymentRoutes);

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
