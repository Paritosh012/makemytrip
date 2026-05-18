const Subscription = require("../models/subscription.model");
const Tenant = require("../models/tenant.model");
const getRazorpay = require("../config/razorpay");

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
      return res.status(400).json({ success: false, message: "No tenant" });
    }

    if (!plan || !PLAN_IDS[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    // ❗ Only block ACTIVE or PENDING
    const existing = await Subscription.findOne({
      tenantId,
      status: { $in: ["ACTIVE", "PENDING"] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === "PENDING"
            ? "Complete pending payment"
            : "Active subscription already exists",
      });
    }

    // 🔥 Create Razorpay subscription
    const rzpSub = await getRazorpay().subscriptions.create({
      plan_id: PLAN_IDS[plan],
      customer_notify: 1,
      total_count: 12,
    });

    // ✅ Save in DB (PENDING)
    const dbSub = await Subscription.create({
      tenantId,
      plan,
      razorpaySubscriptionId: rzpSub.id,
      status: "PENDING",
    });

    return res.json({
      success: true,
      subscriptionId: rzpSub.id,
      data: dbSub,
    });
  } catch (err) {
    console.error("CREATE SUB ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =============================
// VERIFY PAYMENT (FIXED)
// =============================
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_subscription_id } = req.body;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "No tenant",
      });
    }

    // 🔥 Find SAME subscription
    const sub = await Subscription.findOne({
      tenantId,
      razorpaySubscriptionId: razorpay_subscription_id,
      status: "PENDING",
    });

    if (!sub) {
      return res.status(400).json({
        success: false,
        message: "Subscription not found or already processed",
      });
    }

    // 🔥 Fetch from Razorpay
    const rzpSub = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    if (!rzpSub) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay subscription",
      });
    }

    if (rzpSub.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // ✅ UPDATE SAME RECORD (NO NEW CREATE)
    sub.status = "ACTIVE";
    sub.startDate = new Date(rzpSub.start_at * 1000);
    sub.endDate = new Date(rzpSub.current_end * 1000);

    await sub.save();

    // ✅ Activate tenant
    await Tenant.findByIdAndUpdate(tenantId, {
      status: "ACTIVE",
      subscriptionId: sub._id,
    });

    return res.json({
      success: true,
      message: "Subscription activated",
      data: sub,
    });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =============================
// GET CURRENT SUB
// =============================
const getMySubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const subscription = await Subscription.findOne({
      tenantId,
      status: { $in: ["ACTIVE", "PENDING"] },
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: subscription || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
    });
  }
};

// =============================
// CANCEL
// =============================
const cancelSubscription = async (req, res) => {
  try {
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

    await razorpay.subscriptions.cancel(sub.razorpaySubscriptionId);

    sub.status = "CANCELLED";
    sub.cancelledAt = new Date();

    await sub.save();

    return res.json({
      success: true,
      message: "Cancelled successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Cancel failed",
    });
  }
};

module.exports = {
  createSubscription,
  verifySubscriptionPayment,
  getMySubscription,
  cancelSubscription,
};