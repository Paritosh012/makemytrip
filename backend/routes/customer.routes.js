const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const tenantMiddleware = require("../middlewares/tenant.middleware");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customer.controller");

/* Create Customer */
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware(["HOST"]),
  createCustomer
);

/* Get All Customers */
router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware(["HOST"]),
  getCustomers
);

/* Get Single Customer */
router.get(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware(["HOST"]),
  getCustomer
);

/* Update Customer */
router.patch(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware(["HOST"]),
  updateCustomer
);

/* Delete Customer */
router.delete(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  subscriptionMiddleware,
  roleMiddleware(["HOST"]),
  deleteCustomer
);

module.exports = router;