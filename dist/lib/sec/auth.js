"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const user_controller_1 = __importDefault(require("../../crm/user/user_controller"));
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
// end password verification via passport section
// ************************************************************************** \\
// rate limiter to prevent brute force attacks.
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again after 15 minutes",
});
const auth = {
    hash_password,
    limiter,
};
exports.default = auth;
