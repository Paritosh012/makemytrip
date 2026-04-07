const Subscription = require("../models/subscription.model");
const Tenant = require("../models/tenant.model");
const PLANS = require("../config/plan.config");

const purchaseSubscription = async (req, res) => {
  try {
    const { plan } = req.body;

    // 🔥 STEP 1: VALIDATE PLAN
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    // 🔥 STEP 2: GET TENANT FROM AUTH USER (NEVER FROM BODY)
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with any tenant",
      });
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // 🔥 STEP 3: PREVENT DUPLICATE ACTIVE SUBSCRIPTION
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

    // 🔥 STEP 4: CREATE SUBSCRIPTION
    const planConfig = PLANS[plan];

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await Subscription.create({
      tenantId,
      plan,
      maxAgents: planConfig.maxAgents,
      maxBookingsPerMonth: planConfig.maxBookingsPerMonth,
      startDate,
      endDate,
      status: "ACTIVE",
    });

    // 🔥 STEP 5: ACTIVATE TENANT
    tenant.status = "ACTIVE";
    await tenant.save();

    return res.status(201).json({
      success: true,
      message: "Subscription activated successfully",
      data: subscription,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Subscription purchase failed",
    });
  }
};

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

    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
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
  purchaseSubscription,
  getMySubscription,
};
