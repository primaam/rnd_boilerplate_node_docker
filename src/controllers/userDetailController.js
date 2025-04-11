// src/controllers/userDetailController.js
const { User, UserDetail } = require("../models");
const { createError } = require("../utils/error");

// Get user detail
exports.getUserDetail = async (req, res, next) => {
    try {
        const userId = req.params.id || req.user.id;

        const userDetail = await UserDetail.findOne({
            where: { userId },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "username", "email", "role", "createdAt"],
                },
            ],
        });

        if (!userDetail) {
            return next(createError(404, "User detail not found"));
        }

        res.status(200).json(userDetail);
    } catch (error) {
        next(error);
    }
};

// Update user detail
exports.updateUserDetail = async (req, res, next) => {
    try {
        const userId = req.params.id || req.user.id;

        // Check if user detail exists
        let userDetail = await UserDetail.findOne({ where: { userId } });

        if (!userDetail) {
            return next(createError(404, "User detail not found"));
        }

        // Check permission (only admin or self can update)
        if (req.user.role !== "admin" && req.user.id !== userId) {
            return next(createError(403, "You are not authorized to update this user detail"));
        }

        // Update user detail
        await userDetail.update(req.body);

        // Return updated user detail
        userDetail = await UserDetail.findOne({
            where: { userId },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "username", "email", "role"],
                },
            ],
        });

        res.status(200).json({
            message: "User detail updated successfully",
            userDetail,
        });
    } catch (error) {
        next(error);
    }
};

// Delete user detail (only admin)
exports.deleteUserDetail = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Check if user is admin
        if (req.user.role !== "admin") {
            return next(createError(403, "Only admin can delete user details"));
        }

        // Check if user detail exists
        const userDetail = await UserDetail.findOne({ where: { userId } });

        if (!userDetail) {
            return next(createError(404, "User detail not found"));
        }

        // Delete user detail
        await userDetail.destroy();

        res.status(200).json({ message: "User detail deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// Get all user details (only admin)
exports.getAllUserDetails = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            return next(createError(403, "Only admin can view all user details"));
        }

        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get all user details
        const { count, rows } = await UserDetail.findAndCountAll({
            limit,
            offset,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "username", "email", "role", "isActive"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            userDetails: rows,
        });
    } catch (error) {
        next(error);
    }
};
