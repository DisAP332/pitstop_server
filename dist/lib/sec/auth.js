"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const user_controller_1 = __importDefault(require("../../crud/user/user_controller"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ***************************************************************************************** //
// begin hashing section of auth
// Define the number of salt rounds for server-side hashing
// Convert the environment variable to a number
const SERVER_SALT_ROUNDS = parseInt(process.env.HASH_SALT, 10);
if (isNaN(SERVER_SALT_ROUNDS)) {
    throw new Error("Environment variable HASH_SALT must be a valid number");
}
/**
 * Hash a client-side hashed password with a new salt.
 * @param clientHashedPassword - The password that has already been hashed on the client side.
 * @returns The new server-side hashed password.
 */
async function hash_password(clientHashedPassword) {
    try {
        // Generate a new salt on the server
        const serverSalt = await bcryptjs_1.default.genSalt(SERVER_SALT_ROUNDS);
        // Hash the client-side hashed password with the server salt
        const finalServerHashedPassword = await bcryptjs_1.default.hash(clientHashedPassword, serverSalt);
        return finalServerHashedPassword;
    }
    catch (error) {
        console.error("Error hashing password:", error);
        throw new Error("Internal server error");
    }
}
// ************************************************************************** \\
// begin password verification via passport section
// Helper functions
const verify_password = async (user, clientpwd) => {
    console.log("identifier", user.password);
    console.log("clientpwd", clientpwd);
    return bcryptjs_1.default.compare(clientpwd, user.password);
};
// End helper functions
// Begin passport Local Strategy
passport_1.default.use(new passport_local_1.Strategy(async (username, clientpwd, done) => {
    try {
        const user = await user_controller_1.default.find_user_by_username(username);
        console.log(user);
        if (!user) {
            return done(null, false, { message: "Incorrect username." });
        }
        const isValid = await verify_password(user, clientpwd);
        if (!isValid) {
            return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
// End passport Local Strategy
// ********************************************************************* //
// being JWT section
// JWT issuing function
const issue_jwt = (user) => {
    const _id = user.id;
    const expiresIn = "15m";
    const payload = {
        sub: _id,
        iat: Date.now(),
    };
    const signedToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn });
    console.log(`A JWT was issued to: ${user.id}`);
    return {
        token: "Bearer " + signedToken,
        expires: expiresIn,
    };
};
// refresh token
const refresh_access_token = (req, res) => {
    // Assuming the refresh token is stored in req.cookies.refreshToken as "Bearer <token>"
    const bearerToken = req.cookies.refreshToken.token;
    console.log("attempting to refresh a token");
    console.log("Request Headers:", req.headers);
    console.log("Cookies:", req.cookies); // Should show parsed cookies
    // Remove the "Bearer " prefix if it exists
    const refreshToken = bearerToken?.startsWith("Bearer ")
        ? bearerToken.slice(7)
        : bearerToken;
    if (!refreshToken) {
        return res
            .status(401)
            .json({ success: false, message: "No token provided" });
    }
    jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("Token verification error:", err.message);
            return res
                .status(403)
                .json({ success: false, message: "Invalid token" });
        }
        console.log(decoded);
        // Issue a new access token
        const newAccessToken = auth.issue_jwt(decoded);
        return res.json({
            success: true,
            accessToken: newAccessToken,
        });
    });
};
// verify JWT
const authenticate_token = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer Token
    if (token == null)
        return res.sendStatus(401); // No token provided
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err)
            return res.sendStatus(403); // Invalid token
        req.user = user;
        next();
    });
};
// end password verification via passport section
// ************************************************************************** \\
// rate limiter to prevent brute force attacks.
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
});
const auth = {
    hash_password,
    limiter,
    issue_jwt,
    authenticate_token,
    refresh_access_token,
};
exports.default = auth;
