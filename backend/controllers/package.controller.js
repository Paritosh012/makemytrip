const mongoose = require("mongoose");
const Package = require("../models/package.model");

const createPackage = async (req, res) => {
  try {
    const {
      title,
      destination,
      description,
      price,
      seatsTotal,
      startDate,
      endDate,
    } = req.body;

    if (
      !title ||
      !destination ||
      !description ||
      price == null ||
      seatsTotal == null ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    if (typeof seatsTotal !== "number" || seatsTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Seats must be greater than 0",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (start <= now) {
      return res.status(400).json({
        success: false,
        message: "Start date must be in the future",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const newPackage = await Package.create({
      title,
      destination,
      description,
      price,
      seatsTotal,
      seatsAvailable: seatsTotal,
      startDate,
      endDate,
      tenantId: req.user.tenantId,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create package",
    });
  }
};

const getPackages = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 50);
    const skip = (page - 1) * limit;

    const filter = {
      tenantId,
      status: { $ne: "ARCHIVED" },
    };

    const [packages, totalPackages] = await Promise.all([
      Package.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Package.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalPackages / limit);

    return res.status(200).json({
      success: true,
      message: "Packages fetched successfully",
      data: packages,
      pagination: {
        page,
        limit,
        totalPackages,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
    });
  }
};

const getPackage = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const pkg = await Package.findOne({
      _id: id,
      tenantId,
    }).lean();

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Package fetched successfully",
      data: pkg,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch package",
    });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const pkg = await Package.findOne({ _id: id, tenantId });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    const allowedUpdates = [
      "title",
      "destination",
      "description",
      "price",
      "startDate",
      "endDate",
      "status",
    ];

    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(pkg, updates);

    await pkg.save();

    return res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: pkg,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update package",
    });
  }
};

const deletePackage = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const pkg = await Package.findOneAndUpdate(
      { _id: id, tenantId },
      { status: "ARCHIVED" },
      { new: true },
    );

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Package archived successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete package",
    });
  }
};

module.exports = {
  createPackage,
  getPackages,
  getPackage,
  updatePackage,
  deletePackage,
};
