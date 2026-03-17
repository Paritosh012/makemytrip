const mongoose = require("mongoose");

const Tenant = require("../models/tenant.model");
const Subscription = require("../models/subscription.model");

const PLANS = require("../config/plan.config");

/*
-------------------------------------------------------
GET ALL TENANTS
SUPER_ADMIN
-------------------------------------------------------
*/
const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate("ownerId", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error("getTenants error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tenants",
    });
  }
};

/*
-------------------------------------------------------
SUSPEND TENANT
SUPER_ADMIN
-------------------------------------------------------
*/
const suspendTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { status: "SUSPENDED" },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("suspendTenant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to suspend tenant",
    });
  }
};

/*
-------------------------------------------------------
ACTIVATE TENANT
SUPER_ADMIN
-------------------------------------------------------
*/
const activateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { status: "ACTIVE" },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("activateTenant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to activate tenant",
    });
  }
};

/*
-------------------------------------------------------
GET SINGLE TENANT
SUPER_ADMIN
-------------------------------------------------------
*/
const getOneTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const tenant = await Tenant.findById(tenantId)
      .populate("ownerId", "name email")
      .lean();

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const subscription = await Subscription.findOne({ tenantId }).lean();

    return res.status(200).json({
      success: true,
      data: {
        tenant,
        subscription,
      },
    });
  } catch (error) {
    console.error("getOneTenant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tenant",
    });
  }
};

/*
-------------------------------------------------------
UPDATE TENANT PLAN
SUPER_ADMIN
-------------------------------------------------------
*/
const updateTenantPlan = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { planName } = req.body;

    if (!planName) {
      return res.status(400).json({
        success: false,
        message: "Plan name is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const normalizedPlan = planName.toUpperCase();
    const planConfig = PLANS[normalizedPlan];

    if (!planConfig) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { tenantId },
      {
        planName: normalizedPlan,
        maxAgents: planConfig.maxAgents,
        maxBookingsPerMonth: planConfig.maxBookingsPerMonth,
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("updateTenantPlan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update tenant plan",
    });
  }
};

module.exports = {
  getTenants,
  suspendTenant,
  activateTenant,
  getOneTenant,
  updateTenantPlan,
};
 