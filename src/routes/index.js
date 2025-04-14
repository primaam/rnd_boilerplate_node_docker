const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userDetailRoutes = require("./userDetailRoutes");

router.use("/auth", authRoutes);
router.use("/user-details", userDetailRoutes);
