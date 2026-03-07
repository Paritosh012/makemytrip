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

  const normalizedPlan = planName.toUpperCase();
  const planConfig = PLANS[normalizedPlan];

  if (!planConfig) {
    return res.status(400).json({ message: "Invalid subscription plan" });
  }

  try {
    const existingUser = await User.findOne({ email: hostEmail.toLowerCase() });
    if (existingUser) {
      throw new Error("Host email already exists");
    }

    const hashedPassword = await bcrypt.hash(hostPassword, 10);

    const host = await User.create({
      name: hostName,
      email: hostEmail.toLowerCase(),
      password: hashedPassword,
      role: "HOST",
    });

    const tenant = await Tenant.create({
      name: tenantName,
      ownerId: host._id,
    });

    await User.updateOne({ _id: host._id }, { tenantId: tenant._id });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    await Subscription.create({
      tenantId: tenant._id,
      planName: normalizedPlan,
      maxAgents: planConfig.maxAgents,
      maxBookingsPerMonth: planConfig.maxBookingsPerMonth,
      startDate,
      endDate,
    });

    return res.status(201).json({
      message: "Tenant created successfully",
      tenantId: tenant._id,
      hostId: host._id,
      plan: normalizedPlan,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Tenant provisioning failed",
    });
  }
};

const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().populate("ownerId", "name email");

    res.status(200).json({
      message: "Tenants fetched successfully",
      tenants,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tenants",
      error: error.message,
    });
  }
};

module.exports = { createTenant, getTenants };
