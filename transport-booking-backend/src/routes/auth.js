const express = require("express");
const router = express.Router();
const { login, adminLogin } = require("../controllers/authController");

router.post("/login", login);
router.post("/admin-login", adminLogin);

module.exports = router;
