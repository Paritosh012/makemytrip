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
    const { userId } = req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "END_USER") {
      return res.status(403).json({
        success: false,
        message: "Only end users can apply",
      });
    }

    if (user.tenantId) {
      return res.status(400).json({
        success: false,
        message: "User already owns a tenant",
      });
    }

    const { agencyName, businessEmail, phone, description } = req.body;

    if (!agencyName || !businessEmail || !phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const application = await HostApplication.create({
      userId,
      agencyName: agencyName.trim(),
      businessEmail: businessEmail.toLowerCase().trim(),
      phone: phone.trim(),
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Application successfully submited",
      data: application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Application already pending",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
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
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const applications = await HostApplication.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Successfully fetched applications",
      data: applications,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
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

  try {
    const { applicationId } = req.params;

    await session.withTransaction(async () => {
      // 🔥 STEP 1: LOCK APPLICATION (atomic)
      const application = await HostApplication.findOneAndUpdate(
        { _id: applicationId, status: "PENDING" },
        { status: "PROCESSING" },
        { new: true, session },
      );

      if (!application) {
        return res.status(400).json({
          success: "false",
          message: "Application already processed or not found",
        });
      }

      // 🔥 STEP 2: FETCH USER
      const user = await User.findById(application.userId).session(session);

      if (!user) {
        return res.status(404).json({
          success: "false",
          message: "User not found",
        });
      }

      if (user.role === "HOST" || user.tenantId) {
        return res.status(400).json({
          success: "false",
          message: "User already has tenant",
        });
      }

      // 🔥 STEP 3: CREATE TENANT
      const [tenant] = await Tenant.create(
        [
          {
            name: application.agencyName,
            ownerId: user._id,
            status: "PENDING",
          },
        ],
        { session },
      );

      // 🔥 STEP 4: UPDATE USER
      user.role = "HOST";
      user.tenantId = tenant._id;
      await user.save({ session });

      // 🔥 STEP 6: FINALIZE APPLICATION
      application.status = "APPROVED";
      application.reviewedBy = req.user.userId;
      application.reviewedAt = new Date();

      await application.save({ session });
    });

    return res.status(200).json({
      success: true,
      message: "Application approved",
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
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

    const application = await HostApplication.findOneAndUpdate(
      { _id: applicationId, status: "PENDING" },
      {
        status: "REJECTED",
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      },
      { new: true },
    );

    if (!application) {
      return res.status(400).json({
        success: false,
        message: "Application already processed or not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
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
