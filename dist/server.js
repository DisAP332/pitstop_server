"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const sync_1 = __importDefault(require("./db/sync"));
const user_router_1 = __importDefault(require("./crm/user/user_router"));
const user_profile_router_1 = __importDefault(require("./crm/user_profile/user_profile_router"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = __importDefault(require("./lib/sec/auth"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.app = (0, express_1.default)();
// Load the SSL certificate and private key
const privateKey = fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../src/lib/sec/key.pem"), "utf8");
const certificate = fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../src/lib/sec/cert.pem"), "utf8");
const credentials = { key: privateKey, cert: certificate };
// ************************************************************************** \\
// cors section
// List of allowed origins
const allowedOrigins = ["https://localhost:3000"];
// Apply CORS middleware
exports.app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // If the origin is not specified, allow it
        if (!origin)
            return callback(null, true);
        // Check if the origin is in the allowed origins list
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = "The CORS policy for this site does not allow access from the specified Origin.";
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
exports.app.options("*", (0, cors_1.default)());
// Use Helmet to set secure headers
exports.app.use((0, helmet_1.default)());
exports.app.use(helmet_1.default.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"], // Only allow scripts from the same origin
        scriptSrc: ["'self'", "'unsafe-inline'"], // Avoid unsafe inline scripts
        objectSrc: ["'none'"], // Prevents plugins (like Flash)
        // upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
    },
}));
// ************************************************************************** \\
// Middlewere to parse JSON request bodies.
exports.app.use(express_1.default.json());
exports.app.use((0, cookie_parser_1.default)());
(0, sync_1.default)();
exports.app.use("/user", auth_1.default.limiter, user_router_1.default);
exports.app.use("/user/profile", user_profile_router_1.default);
const httpPort = process.env.HTTP_PORT;
const httpsPort = process.env.HTTPS_PORT;
exports.app.listen(httpPort, () => {
    console.log(`HTTP server running on ${httpPort}`);
});
const httpsServer = https_1.default.createServer(credentials, exports.app);
httpsServer.listen(8443, () => {
    console.log("HTTPS Server running on https://localhost:8443");
});
