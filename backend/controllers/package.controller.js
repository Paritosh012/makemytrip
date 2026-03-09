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
        message: "All fields required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

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
      message: "Package successfully created",
      data: newPackage,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating package",
    });
  }
};

const getPackages = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 50);

    const skip = (page - 1) * limit;

    const [packages, totalPackages] = await Promise.all([
      Package.find({ tenantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Package.countDocuments({ tenantId }),
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
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching packages",
    });
  }
};

const getPackage = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const packageId = req.params.id;

    const pkg = await Package.findOne({ _id: packageId, tenantId }).lean();

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Package fetched successfully",
      data: pkg,
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching package",
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

    const updates = req.body;

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
      message: "Something went wrong while updating package",
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
      message: "Something went wrong while deleting package",
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
