const jwt = require("jsonwebtoken");
const { User, UserDetail } = require("../models");
const { createError } = require("../utils/error");

// Generate tokens
const generateTokens = (user) => {
    // Access token
    const accessToken = jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    // Refresh token
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });

    return { accessToken, refreshToken };
};

// Register new user
exports.register = async (req, res, next) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [User.sequelize.Op.or]: [{ username }, { email }],
            },
        });

        if (existingUser) {
            return next(createError(400, "Username or email already exists"));
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
        });

        // Create user details
        await UserDetail.create({
            userId: user.id,
            firstName,
            lastName,
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        // Return response
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        next(error);
    }
};

// Login user
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return next(createError(401, "Invalid credentials"));
        }

        // Check if user is active
        if (!user.isActive) {
            return next(createError(401, "Account is disabled"));
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return next(createError(401, "Invalid credentials"));
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        // Return response
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        next(error);
    }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return next(createError(400, "Refresh token is required"));
        }

        // Find user with the refresh token
        const user = await User.findOne({ where: { refreshToken } });
        if (!user) {
            return next(createError(403, "Invalid refresh token"));
        }

        // Verify refresh token
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err || user.id !== decoded.id) {
                return next(createError(403, "Invalid refresh token"));
            }

            // Generate new tokens
            const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

            // Update refresh token in database
            user.refreshToken = newRefreshToken;
            await user.save();

            // Return response
            res.status(200).json({
                accessToken,
                refreshToken: newRefreshToken,
            });
        });
    } catch (error) {
        next(error);
    }
};

// Logout user
exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return next(createError(400, "Refresh token is required"));
        }

        // Find user with the refresh token
        const user = await User.findOne({ where: { refreshToken } });
        if (!user) {
            return res.status(204).json({ message: "Logged out successfully" });
        }

        // Clear refresh token
        user.refreshToken = null;
        await user.save();

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};
