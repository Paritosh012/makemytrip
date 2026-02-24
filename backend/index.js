require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const tenantRoutes = require("./routes/tenant.routes");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    environment: process.env.NODE_ENV || "development",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);

const PORT = process.env.PORT;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
