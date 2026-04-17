const mongoose = require("mongoose");

const Tenant = require("../models/tenant.model");
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");

const ALLOWED_PERMISSIONS = require("../config/permissions");
const PLANS = require("../config/plan.config");

/*
-------------------------------------------------------
AUDIT HELPER (basic, non-overengineered)
-------------------------------------------------------
*/
const audit = (action, userId, targetId) => {
  console.log(`[AUDIT] ${action} by ${userId} on ${targetId}`);
};

/*
-------------------------------------------------------
GET ALL TENANTS
-------------------------------------------------------
*/
const getTenants = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const tenants = await Tenant.find(query)
      .populate("ownerId", "name email")
      .populate(
        "subscriptionId",
        "plan maxAgents maxBookingsPerMonth startDate endDate status",
      )
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Tenant.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: tenants,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
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
GET SINGLE TENANT
-------------------------------------------------------
*/
const getOneTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tenant ID" });
    }

    const tenant = await Tenant.findById(tenantId)
      .populate("ownerId", "name email")
      .populate(
        "subscriptionId",
        "plan maxAgents maxBookingsPerMonth startDate endDate status",
      )
      .lean();

    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    return res.status(200).json({ success: true, data: tenant });
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
SUSPEND TENANT
-------------------------------------------------------
*/
const suspendTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tenant ID" });
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    if (tenant.status === "SUSPENDED") {
      return res
        .status(400)
        .json({ success: false, message: "Already suspended" });
    }

    tenant.status = "SUSPENDED";
    await tenant.save();

    audit("SUSPEND_TENANT", req.user._id, tenantId);

    return res.status(200).json({ success: true, data: tenant });
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
-------------------------------------------------------
*/
const activateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tenant ID" });
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    if (tenant.status === "ACTIVE") {
      return res
        .status(400)
        .json({ success: false, message: "Already active" });
    }

    tenant.status = "ACTIVE";
    await tenant.save();

    audit("ACTIVATE_TENANT", req.user._id, tenantId);

    return res.status(200).json({ success: true, data: tenant });
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
UPDATE TENANT PLAN (TRANSACTION FIXED)
-------------------------------------------------------
*/
const updateTenantPlan = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { tenantId } = req.params;
    const { plan } = req.body;

    if (!plan) {
      throw new Error("Plan is required");
    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      throw new Error("Invalid tenant ID");
    }

    const normalizedPlan = plan.toUpperCase();
    const planConfig = PLANS[normalizedPlan];

    if (!planConfig) {
      throw new Error("Invalid plan");
    }

    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) throw new Error("Tenant not found");

    const subscription = await Subscription.findOne({ tenantId }).session(
      session,
    );
    if (!subscription) throw new Error("Subscription not found");

    if (subscription.plan === normalizedPlan) {
      throw new Error("Already on this plan");
    }

    // Update subscription
    subscription.plan = normalizedPlan;
    subscription.maxAgents = planConfig.maxAgents;
    subscription.maxBookingsPerMonth = planConfig.maxBookingsPerMonth;

    await subscription.save({ session });

    // Update tenant
    tenant.subscriptionId = subscription._id;
    await tenant.save({ session });

    await session.commitTransaction();
    session.endSession();

    audit("UPDATE_PLAN", req.user._id, tenantId);

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("updateTenantPlan error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update plan",
    });
  }
};

/*
-------------------------------------------------------
GET ALL USERS
-------------------------------------------------------
*/
const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const { role } = req.query;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select("-password -otp")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: users,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/*
-------------------------------------------------------
PROMOTE USER TO ADMIN
-------------------------------------------------------
*/
const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only SUPER_ADMIN can promote users",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({ success: false, message: "Already admin" });
    }

    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Cannot modify SUPER_ADMIN",
      });
    }

    user.role = "ADMIN";
    user.permissions = [];

    await user.save();

    audit("PROMOTE_ADMIN", req.user._id, userId);

    return res.status(200).json({
      success: true,
      message: "User promoted to ADMIN",
      data: user,
    });
  } catch (error) {
    console.error("promoteToAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to promote user",
    });
  }
};

/*
-------------------------------------------------------
UPDATE USER PERMISSIONS
-------------------------------------------------------
*/
const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Permissions must be an array",
      });
    }

    const invalid = permissions.filter((p) => !ALLOWED_PERMISSIONS.includes(p));
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid permissions: ${invalid.join(", ")}`,
      });
    }

    const user = await User.findById(userId);

    if (!user || user.role !== "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "User is not an admin",
      });
    }

    user.permissions = permissions;

    await user.save();

    audit("UPDATE_PERMISSIONS", req.user._id, userId);

    return res.status(200).json({
      success: true,
      message: "Permissions updated",
      data: user,
    });
  } catch (error) {
    console.error("updateUserPermissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update permissions",
    });
  }
};

/*
-------------------------------------------------------
SUSPEND / ACTIVATE USER
-------------------------------------------------------
*/
const suspendUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // ❌ prevent self suspend
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({ message: "You cannot suspend yourself" });
  }

  // ❌ prevent super admin suspend
  if (user.role === "SUPER_ADMIN") {
    return res.status(400).json({ message: "Cannot suspend SUPER_ADMIN" });
  }

  user.isSuspended = !user.isSuspended;

  await user.save();

  res.json({
    message: user.isSuspended ? "User suspended" : "User activated",
    user,
  });
};

module.exports = {
  getTenants,
  getOneTenant,
  suspendTenant,
  activateTenant,
  updateTenantPlan,
  getAllUsers,
  promoteToAdmin,
  updateUserPermissions,
  suspendUser,
};
