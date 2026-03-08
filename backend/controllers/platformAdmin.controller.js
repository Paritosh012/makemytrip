const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const Tenant = require("../models/tenant.model");
const Subscription = require("../models/subscription.model");
const PLANS = require("../config/plan.config");

const createTenant = async (req, res) => {
  const { tenantName, hostName, hostEmail, hostPassword, planName } = req.body;

  if (!tenantName || !hostName || !hostEmail || !hostPassword || !planName) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const normalizedEmail = hostEmail.toLowerCase();
  const normalizedPlan = planName.toUpperCase();
  const planConfig = PLANS[normalizedPlan];

  if (!planConfig) {
    return res.status(400).json({
      message: "Invalid subscription plan",
    });
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "Host email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(hostPassword, 10);

    const host = await User.create({
      name: hostName,
      email: normalizedEmail,
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
      data: {
        tenantId: tenant._id,
        hostId: host._id,
        plan: normalizedPlan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Tenant provisioning failed",
      error: error.message,
    });
  }
};

const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().populate("ownerId", "name email");

    return res.status(200).json({
      message: "Tenants fetched successfully",
      data: tenants,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tenants",
      error: error.message,
    });
  }
};

const suspendTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { status: "SUSPENDED" },
      { new: true },
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    res.status(200).json({
      message: "Tenant successfully suspended",
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to suspend tenant",
      error: error.message,
    });
  }
};

const activateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { status: "ACTIVE" },
      { new: true },
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    res.status(200).json({
      message: "Tenant successfully activated",
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to activate tenant",
      error: error.message,
    });
  }
};

const getOneTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId).populate(
      "ownerId",
      "name email",
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    const subscription = await Subscription.findOne({ tenantId });

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      message: "Tenant successfully fetched",
      tenant,
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tenant",
      error: error.message,
    });
  }
};

const updateTenantPlan = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { planName } = req.body;

    if (!planName) {
      return res.status(400).json({
        message: "Plan name is required",
      });
    }

    const normalizePlan = planName.toUpperCase();
    const configPlan = PLANS[normalizePlan];

    if (!configPlan) {
      return res.status(400).json({
        message: "Invalid plan",
      });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { tenantId },
      {
        planName: normalizePlan,
        maxAgents: configPlan.maxAgents,
        maxBookingsPerMonth: configPlan.maxBookingsPerMonth,
      },
      { new: true },
    );

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      message: "Tenant plan updated successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update plan",
      error: error.message,
    });
  }
};

module.exports = {
  createTenant,
  getTenants,
  suspendTenant,
  activateTenant,
  getOneTenant,
  updateTenantPlan,
};
