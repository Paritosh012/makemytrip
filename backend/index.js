require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const platformAdminRoutes = require("./routes/platformAdmin.routes");
const hostApplicationRoutes = require("./routes/host.application.routes");
const packageRoutes = require("./routes/package.routes");
const subscriptionRoutes = require("./routes/subscription.routes.js");
const bookingRoutes = require("./routes/booking.routes.js");
const paymentRoutes = require("./routes/payment.routes");

const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(
  cors({
    origin: "https://makemytrip-1-x58v.onrender.com",
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tenants", platformAdminRoutes);
app.use("/api/host-applications", hostApplicationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
