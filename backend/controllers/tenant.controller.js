const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const Tenant = require("../models/tenant.model");
const Subscription = require("../models/subscription.model");
const PLANS = require("../config/plan.config");

const createTenant = async (req, res) => {
  const { tenantName, hostName, hostEmail, hostPassword, planName } = req.body;         
};

module.exports = { createTenant };
