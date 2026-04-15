require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

// ROUTES
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes"); // ✅ renamed
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
  "http://localhost:5173",
  "https://makemytrip-frontend-kvdy.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
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

// Public/Auth
app.use("/api/auth", authLimiter, authRoutes);

// Admin (🔥 FIXED)
app.use("/api/admin", globalLimiter, adminRoutes);

// Domain routes
app.use("/api/host-applications", globalLimiter, hostApplicationRoutes);
app.use("/api/packages", globalLimiter, packageRoutes);
app.use("/api/subscriptions", globalLimiter, subscriptionRoutes);
app.use("/api/bookings", globalLimiter, bookingRoutes);
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
