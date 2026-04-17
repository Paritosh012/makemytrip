const Subscription = require("../models/subscription.model");
const Tenant = require("../models/tenant.model");
const PLANS = require("../config/plan.config");
const razorpay = require("../config/razorpay");

const PLAN_IDS = {
  BASIC: "plan_SeHc38lJOsX9uV",
  PRO: "plan_SeHcj7LrOhwABY",
  PREMIUM: "plan_SeHdz0VMj6oA9f",
};

// =============================
// CREATE SUBSCRIPTION
// =============================
const createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "User not linked to tenant" });
    }

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const planId = PLAN_IDS[plan];
    if (!planId) {
      return res
        .status(400)
        .json({ success: false, message: "Plan not configured" });
    }

    // ✅ Prevent duplicate ACTIVE
    const existing = await Subscription.findOne({ tenantId, status: "ACTIVE" });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Active subscription already exists",
      });
    }

    // ✅ If a PENDING sub already exists for this plan, reuse it
    const pending = await Subscription.findOne({ tenantId, status: "PENDING" });
    if (pending && pending.razorpaySubscriptionId) {
      return res.json({
        success: true,
        subscriptionId: pending.razorpaySubscriptionId,
        data: pending,
      });
    }

    // 🔥 Create new Razorpay subscription
    const rzpSub = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
    });

    const { maxAgents, maxBookingsPerMonth } = PLANS[plan];

    const dbSub = await Subscription.findOneAndUpdate(
      { tenantId },
      {
        tenantId,
        plan,
        razorpaySubscriptionId: rzpSub.id,
        status: "PENDING",
        maxAgents,
        maxBookingsPerMonth,
        startDate: null,
        endDate: null,
      },
      { upsert: true, new: true },
    );

    return res.json({
      success: true,
      subscriptionId: rzpSub.id,
      data: dbSub,
    });
  } catch (err) {
    console.error("CREATE SUB ERROR:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create subscription" });
  }
};

// =============================
// VERIFY PAYMENT
// =============================
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_subscription_id } = req.body;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "Tenant not found" });
    }

    // ✅ Ensure subscription belongs to this tenant
    const existing = await Subscription.findOne({
      tenantId,
      razorpaySubscriptionId: razorpay_subscription_id,
    });

    if (!existing) {
      return res
        .status(400)
        .json({ success: false, message: "Subscription mismatch" });
    }

    // 🔥 Fetch from Razorpay to confirm payment status
    const rzpSub = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    console.log("Razorpay status:", rzpSub.status);

    if (!rzpSub) {
      return res.status(400).json({
        success: false,
        message: "Subscription not found on Razorpay",
      });
    }

    const validStatuses = ["active", "authenticated"];
    if (!validStatuses.includes(rzpSub.status)) {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Razorpay status: ${rzpSub.status}`,
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // ✅ Activate subscription
    const updatedSub = await Subscription.findOneAndUpdate(
      { tenantId },
      { status: "ACTIVE", startDate, endDate },
      { new: true },
    );

    if (!updatedSub) {
      throw new Error("Subscription update failed");
    }

    // ✅ Update tenant
    const tenant = await Tenant.findByIdAndUpdate(tenantId, {
      status: "ACTIVE",
      subscriptionId: updatedSub._id,
    });

    if (!tenant) {
      // rollback
      await Subscription.findOneAndUpdate({ tenantId }, { status: "PENDING" });
      throw new Error("Tenant update failed");
    }

    return res.json({
      success: true,
      message: "Subscription activated",
      data: updatedSub,
    });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Verification failed" });
  }
};

// =============================
// GET SUBSCRIPTION
// =============================
const getMySubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "No tenant found" });
    }

    const subscription = await Subscription.findOne({ tenantId });

    return res.json({ success: true, data: subscription || null });
  } catch (err) {
    console.error("GET SUB ERROR:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch subscription" });
  }
};

const getSubscriptionHistory = async (req, res) => {
  const tenantId = req.user.tenantId;

  const subs = await Subscription.find({ tenantId }).sort({ createdAt: -1 });

  res.json({ success: true, data: subs });
};
// POST /subscriptions/cancel
const cancelSubscription = async (req, res) => {
  const tenantId = req.user.tenantId;

  const sub = await Subscription.findOne({
    tenantId,
    status: "ACTIVE",
  });

  if (!sub) {
    return res.status(400).json({
      success: false,
      message: "No active subscription",
    });
  }

  // 🔥 Cancel in Razorpay
  await razorpay.subscriptions.cancel(sub.razorpaySubscriptionId);

  sub.status = "CANCELLED";
  sub.cancelledAt = new Date();
  await sub.save();

  res.json({ success: true, message: "Subscription cancelled" });
};

module.exports = {
  createSubscription,
  verifySubscriptionPayment,
  getMySubscription,
  getSubscriptionHistory,
  cancelSubscription,
};
