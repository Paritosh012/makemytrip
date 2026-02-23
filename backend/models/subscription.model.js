const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  planName: {
    type: String,
    required: true,
    enum: ["BASIC", "PRO", "PREMIUM"],
  },
  maxAgents: {
    type: Number,
    default: 20,
    
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
