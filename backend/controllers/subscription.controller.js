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
    const razorpay = getRazorpay();

    const plan =
      typeof req.body.plan === "string"
        ? req.body.plan.trim().toUpperCase()
        : null;

    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!plan || !PLAN_IDS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    const existing = await Subscription.findOne({
      tenantId,
      status: { $in: ["ACTIVE", "PENDING"] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === "PENDING"
            ? "Complete pending payment first"
            : "Active subscription already exists",
      });
    }

    const rzpSub = await razorpay.subscriptions.create({
      plan_id: PLAN_IDS[plan],
      customer_notify: 1,
      total_count: 12,
    });

    const dbSub = await Subscription.create({
      tenantId,
      plan,
      razorpaySubscriptionId: rzpSub.id,
      status: "PENDING",
    });

    return res.status(201).json({
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
// VERIFY SUBSCRIPTION
// =============================
const verifySubscriptionPayment = async (req, res) => {
  try {
    const razorpay = getRazorpay();

    const { razorpay_subscription_id } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!razorpay_subscription_id) {
      return res.status(400).json({
        success: false,
        message: "Subscription id required",
      });
    }

    const sub = await Subscription.findOne({
      tenantId,
      razorpaySubscriptionId: razorpay_subscription_id,
      status: "PENDING",
    });

    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

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
        message: `Subscription status is ${rzpSub.status}`,
      });
    }

    sub.status = "ACTIVE";

    if (rzpSub.start_at) {
      sub.startDate = new Date(rzpSub.start_at * 1000);
    }

    if (rzpSub.current_end) {
      sub.endDate = new Date(rzpSub.current_end * 1000);
    }

    await sub.save();

    await Tenant.findByIdAndUpdate(
      tenantId,
      {
        status: "ACTIVE",
        subscriptionId: sub._id,
      },
      {
        returnDocument: "after",
      }
    );

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
// GET CURRENT SUBSCRIPTION
// =============================
const getMySubscription = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const subscription = await Subscription.findOne({
      tenantId,
      status: { $in: ["ACTIVE", "PENDING"] },
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: subscription,
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
// CANCEL SUBSCRIPTION
// =============================
const cancelSubscription = async (req, res) => {
  try {
    const razorpay = getRazorpay();

    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const sub = await Subscription.findOne({
      tenantId,
      status: "ACTIVE",
    }).sort({ createdAt: -1 });

    if (!sub) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    await razorpay.subscriptions.cancel(
      sub.razorpaySubscriptionId
    );

    sub.status = "CANCELLED";
    sub.cancelledAt = new Date();

    await sub.save();

    await Tenant.findByIdAndUpdate(
      tenantId,
      {
        status: "PENDING",
        subscriptionId: null,
      },
      {
        returnDocument: "after",
      }
    );

    return res.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (err) {
    console.error("CANCEL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createSubscription,
  verifySubscriptionPayment,
  getMySubscription,
  cancelSubscription,
};