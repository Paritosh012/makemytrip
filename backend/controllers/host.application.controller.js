const mongoose = require("mongoose");

const HostApplication = require("../models/host.application.model");
const User = require("../models/user.model");
const Tenant = require("../models/tenant.model");
const Subscription = require("../models/subscription.model");

const PLANS = require("../config/plan.config");

/*
--------------------------------------------
END USER SUBMIT APPLICATION
--------------------------------------------
*/
const submitApplication = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { agencyName, businessEmail, phone, description } = req.body;

    const existing = await HostApplication.findOne({ userId });

    if (existing) {
      return res.status(400).json({
        message: "Application already submitted",
      });
    }

    const application = await HostApplication.create({
      userId,
      agencyName,
      businessEmail,
      phone,
      description,
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Application submission failed",
    });
  }
};

/*
--------------------------------------------
SUPER ADMIN GET APPLICATIONS
--------------------------------------------
*/
const getApplications = async (req, res) => {
  try {
    const applications = await HostApplication.find({
      status: "PENDING",
    }).populate("userId", "name email");

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch applications",
    });
  }
};

/*
--------------------------------------------
SUPER ADMIN APPROVE APPLICATION
--------------------------------------------
*/
const approveApplication = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { applicationId } = req.params;

    const application = await HostApplication.findById(applicationId).session(
      session
    );

    if (!application || application.status !== "PENDING") {
      throw new Error("Invalid application");
    }

    const user = await User.findById(application.userId).session(session);

    if (!user) throw new Error("User not found");

    if (user.role === "HOST") {
      throw new Error("User already became host");
    }

    const tenant = await Tenant.create(
      [
        {
          name: application.agencyName,
          ownerId: user._id,
        },
      ],
      { session }
    );

    user.role = "HOST";
    user.tenantId = tenant[0]._id;

    await user.save({ session });

    const planConfig = PLANS.BASIC;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    await Subscription.create(
      [
        {
          tenantId: tenant[0]._id,
          planName: "BASIC",
          maxAgents: planConfig.maxAgents,
          maxBookingsPerMonth: planConfig.maxBookingsPerMonth,
          startDate,
          endDate,
        },
      ],
      { session }
    );

    application.status = "APPROVED";
    application.reviewedBy = req.user.userId;
    application.reviewedAt = new Date();

    await application.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Application approved",
      tenantId: tenant[0]._id,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

/*
--------------------------------------------
SUPER ADMIN REJECT APPLICATION
--------------------------------------------
*/
const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await HostApplication.findByIdAndUpdate(
      applicationId,
      {
        status: "REJECTED",
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Reject failed",
    });
  }
};

module.exports = {
  submitApplication,
  getApplications,
  approveApplication,
  rejectApplication,
};