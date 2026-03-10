const mongoose = require("mongoose");
const Customer = require("../models/customer.model");

const createCustomer = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;

    const { name, email, phone, address } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    const newCustomer = await Customer.create({
      tenantId,
      name,
      email,
      phone,
      address,
      createdBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 50);

    const skip = (page - 1) * limit;

    const [customers, totalCustomers] = await Promise.all([
      Customer.find({ tenantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Customer.countDocuments({ tenantId }),
    ]);

    const totalPages = Math.ceil(totalCustomers / limit);

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: customers,
      pagination: {
        page,
        limit,
        totalCustomers,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

const getCustomer = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      tenantId,
    }).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({ _id: id, tenantId });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const allowedUpdates = ["name", "email", "phone", "address"];

    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(customer, updates);

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists for this tenant",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOneAndDelete({
      _id: id,
      tenantId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};
