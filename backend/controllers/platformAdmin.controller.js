const mongoose = require("mongoose");

const Tenant = require("../models/tenant.model");
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");

const ALLOWED_PERMISSIONS = require("../config/permissions");
const PLANS = require("../config/plan.config");

/*
-------------------------------------------------------
AUDIT HELPER
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

    audit("SUSPEND_TENANT", req.user.userId, tenantId);

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

    audit("ACTIVATE_TENANT", req.user.userId, tenantId);

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
UPDATE TENANT PLAN
-------------------------------------------------------
*/
const updateTenantPlan = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { tenantId } = req.params;
    const { plan } = req.body;

    // FIX: validation errors are 400, but we need to distinguish them from
    // unexpected server errors (which must be 500). Validate before entering
    // the transaction so we can return early without starting one needlessly.
    if (!plan) {
      return res
        .status(400)
        .json({ success: false, message: "Plan is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tenant ID" });
    }

    const normalizedPlan = plan.toUpperCase();
    const planConfig = PLANS[normalizedPlan];

    if (!planConfig) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plan" });
    }

    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    const subscription = await Subscription.findOne({ tenantId }).session(
      session,
    );
    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    if (subscription.plan === normalizedPlan) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Already on this plan" });
    }

    subscription.plan = normalizedPlan;
    subscription.maxAgents = planConfig.maxAgents;
    subscription.maxBookingsPerMonth = planConfig.maxBookingsPerMonth;
    await subscription.save({ session });

    tenant.subscriptionId = subscription._id;
    await tenant.save({ session });

    await session.commitTransaction();
    session.endSession();

    audit("UPDATE_PLAN", req.user.userId, tenantId);

    return res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    // FIX: only unexpected errors reach here — always 500
    await session.abortTransaction();
    session.endSession();

    console.error("updateTenantPlan error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update plan",
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

    // FIX: added missing ObjectId validation (all other endpoints have this)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    // NOTE: role check is intentionally kept here as a defence-in-depth guard.
    // The route is already protected by permissionMiddleware("MANAGE_USERS"),
    // but promoting to ADMIN is sensitive enough to warrant an explicit check.
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
      return res
        .status(400)
        .json({ success: false, message: "Already admin" });
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

    audit("PROMOTE_ADMIN", req.user.userId, userId);

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

    audit("UPDATE_PERMISSIONS", req.user.userId, userId);

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
  // FIX 1: wrapped entire handler in try/catch — original had none,
  //         meaning any DB error would cause an unhandled promise rejection
  try {
    // FIX 2: original used req.params.id but the router registers /:userId —
    //         destructure consistently with the route param name
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // FIX 3: original compared against req.user.id — the rest of the codebase
    //         uses req.user.userId (set by authMiddleware). Using .id silently
    //         never matches, so the self-suspend guard was effectively disabled.
    if (user._id.toString() === req.user.userId) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot suspend yourself" });
    }

    if (user.role === "SUPER_ADMIN") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot suspend SUPER_ADMIN" });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    // FIX 4: audit call was missing entirely in the original
    audit(
      user.isSuspended ? "SUSPEND_USER" : "ACTIVATE_USER",
      req.user.userId,
      userId,
    );

    return res.status(200).json({
      success: true,
      message: user.isSuspended ? "User suspended" : "User activated",
      data: user,
    });
  } catch (error) {
    console.error("suspendUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
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