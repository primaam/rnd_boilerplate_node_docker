// src/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { createError } = require("../utils/error");

// Verify JWT token
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(createError(401, "Access token is required"));
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(createError(401, "Token expired"));
        }
        return next(createError(403, "Invalid token"));
    }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return next(createError(403, "Admin access required"));
    }
    next();
};

// Verify user exists
exports.verifyUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return next(createError(404, "User not found"));
        }

        if (!user.isActive) {
            return next(createError(403, "Account is disabled"));
        }

        next();
    } catch (error) {
        next(error);
    }
};
