const Package = require("../models/package.model");

const archiveExpiredPackages = async () => {
  try {
    await Package.updateMany(
      {
        endDate: { $lt: new Date() },
        status: "ACTIVE",
      },
      {
        $set: { status: "ARCHIVED" },
      },
    );
  } catch (error) {
    console.error("AUTO ARCHIVE ERROR:", error);
  }
};

module.exports = archiveExpiredPackages;