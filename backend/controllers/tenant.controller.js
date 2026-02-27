const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const Tenant = require("../models/tenant.model");
const Subscription = require("../models/subscription.model");
const PLANS = require("../config/plan.config");

const createTenant = async (req, res) => {
  const { tenantName, hostName, hostEmail, hostPassword, planName } = req.body;

  if (!tenantName || !hostName || !hostEmail || !hostPassword || !planName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const planConfig = PLANS[planName];
  if (!planConfig) {
    return res.status(400).json({ message: "Invalid subscription plan" });
  }

  try {
    const existingUser = await User.findOne({ email: hostEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Host email already exists" });
    }

    const hashedPassword = await bcrypt.hash(hostPassword, 10);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [host] = await User.create(
        [
          {
            name: hostName,
            email: hostEmail,
            password: hashedPassword,
            role: "HOST",
          },
        ],
        { session },
      );

      const [tenant] = await Tenant.create(
        [
          {
            name: tenantName,
            ownerId: host._id,
          },
        ],
        { session },
      );

      await User.updateOne(
        { _id: host._id },
        { tenantId: tenant._id },
        { session },
      );

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const [subscription] = await Subscription.create(
        [
          {
            tenantId: tenant._id,
            planName: planName,
            maxAgents: planConfig.maxAgents,
            maxBookingsPerMonth: planConfig.maxBookingsPerMonth,
            startDate,
            endDate,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: "Tenant created successfully",
        tenantId: tenant._id,
        hostId: host._id,
        plan: planName,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: "Tenant provisioning failed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createTenant };
