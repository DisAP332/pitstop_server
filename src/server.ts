import express, { Express, NextFunction, Request, Response } from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import connectToDatabase from "./db/sync";
import user_router from "./crud/user/user_router";
import user_profile_router from "./crud/user/user_profile/user_profile_router";
import cors from "cors";
import user_controller from "./crud/user/user_controller";
import helmet from "helmet";
import auth from "./lib/sec/auth";
import https from "https";
import path from "path";
import fs from "fs";

const app: Express = express();

// Load the SSL certificate and private key
const privateKey = fs.readFileSync(
  path.resolve(__dirname, "../src/lib/sec/key.pem"),
  "utf8"
);
const certificate = fs.readFileSync(
  path.resolve(__dirname, "../src/lib/sec/cert.pem"),
  "utf8"
);

const credentials = { key: privateKey, cert: certificate };

// ************************************************************************** \\
// cors section

// List of allowed origins
const allowedOrigins = ["https://localhost:3000"];

// Apply CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // If the origin is not specified, allow it
      if (!origin) return callback(null, true);

      // Check if the origin is in the allowed origins list
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }

      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

// Use Helmet to set secure headers
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Only allow scripts from the same origin
      scriptSrc: ["'self'", "'unsafe-inline'"], // Avoid unsafe inline scripts
      objectSrc: ["'none'"], // Prevents plugins (like Flash)
      upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
    },
  })
);

// ************************************************************************** \\

// Middlewere to parse JSON request bodies.
app.use(express.json());
app.use(cookieParser());

connectToDatabase();

// Validate JWT Secret at startup
if (!process.env.JWT_SECRET) {
  console.error("Fatal Error: JWT_SECRET is not defined.");
  process.exit(1);
}

app.use("/user", auth.limiter, user_router);
app.use("/user/profile", user_profile_router);

const httpPort = process.env.HTTP_PORT;
const httpsPort = process.env.HTTPS_PORT;

app.listen(httpPort, () => {
  console.log(`HTTP server running on ${httpPort}`);
});

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(8443, () => {
  console.log("HTTPS Server running on https://localhost:8443");
});
