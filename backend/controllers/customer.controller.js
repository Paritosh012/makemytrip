const Customer = require("../models/customer.model");

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

    const updates = req.body;

    Object.assign(customer, updates);

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating customer",
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

    const customer = await Customer.findOneAndUpdate(
      { _id: id, tenantId },
      { status: "ARCHIVED" },
      { new: true },
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer archived successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting customer",
    });
  }
};

module.exports = {
  updateCustomer,
  deleteCustomer,
};
