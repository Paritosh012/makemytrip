const Subscription = require("../models/subscription.model");
const Tenant = require("../models/tenant.model");
const PLANS = require("../config/plan.config");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

// =============================
// 🔥 CREATE ORDER (STEP 1)
// =============================
const createSubscriptionOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    // ✅ Validate plan
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "User not linked to tenant",
      });
    }

    // ✅ Prevent duplicate active subscription
    const existing = await Subscription.findOne({
      tenantId,
      status: "ACTIVE",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Active subscription already exists",
      });
    }

    // ✅ Pricing (centralize this later)
    const PLAN_PRICING = {
      BASIC: 999,
      PRO: 2499,
      PREMIUM: 5999,
    };

    const amount = PLAN_PRICING[plan];

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `sub_${tenantId.toString().slice(-6)}_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};

// =============================
// 🔥 VERIFY PAYMENT (STEP 2)
// =============================
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
      req.body;

    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    // ✅ Verify Razorpay signature
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // ✅ Prevent duplicate activation (idempotency)
    const existing = await Subscription.findOne({
      tenantId,
      status: "ACTIVE",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Subscription already active",
      });
    }

    // ✅ Plan config
    const planConfig = PLANS[plan];

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // ✅ Create or update subscription
    const subscription = await Subscription.findOneAndUpdate(
      { tenantId },
      {
        plan,
        maxAgents: planConfig.maxAgents,
        maxBookingsPerMonth: planConfig.maxBookingsPerMonth,
        startDate,
        endDate,
        status: "ACTIVE",
      },
      { returnDocument: "after", upsert: true },
    );

    // ✅ Activate tenant
    await Tenant.findByIdAndUpdate(tenantId, {
      status: "ACTIVE",
      subscriptionId: subscription._id,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

// =============================
// 🔥 GET CURRENT SUBSCRIPTION
// =============================
const getMySubscription = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "No tenant associated",
      });
    }

    const subscription = await Subscription.findOne({
      tenantId,
      status: "ACTIVE",
    });

    return res.status(200).json({
      success: true,
      data: subscription || null,
    });
  } catch (error) {
    console.error("GET SUBSCRIPTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
    });
  }
};

module.exports = {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscription,
};
