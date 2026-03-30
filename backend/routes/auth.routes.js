const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  setPassword,
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/set-password", setPassword);
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
