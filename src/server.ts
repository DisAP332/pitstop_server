import dotenv from "dotenv";
import path from "path";

// Load environment variables before any other imports
dotenv.config({ path: path.resolve(__dirname, "../.env") });


import express, { Express, NextFunction, Request, Response } from "express";
import auth from "./lib/sec/auth"; // auth.ts can now access process.env
import cookieParser from "cookie-parser";
import connectToDatabase from "./db/sync";
import user_router from "./crm/user/user_router";
import user_profile_router from "./crm/user_profile/user_profile_router";
import cors from "cors";
import helmet from "helmet";
import https from "https";
import fs from "fs";

export const app: Express = express();

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
// CORS configuration

const allowedOrigins = ["https://localhost:3000"];

// Apply CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow if origin is undefined (for tools like Postman)

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }

      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // Allows credentials like cookies to be sent
  })
);

app.options("*", cors());

// ************************************************************************** \\
// Use Helmet to set secure headers
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Only allow scripts from the same origin
      scriptSrc: ["'self'", "'unsafe-inline'"], // Avoid unsafe inline scripts
      objectSrc: ["'none'"], // Prevents plugins (like Flash)
      upgradeInsecureRequests: [], // Optionally enforce HTTPS (uncomment if needed)
    },
  })
);

// ************************************************************************** \\
// Middlewares
app.use(express.json());
app.use(cookieParser());

// ************************************************************************** \\
// Database connection
connectToDatabase();

// ************************************************************************** \\
// Routes
app.use("/user", auth.limiter, user_router);
app.use("/user/profile", user_profile_router);

// ************************************************************************** \\
// Error handling middleware (for unhandled routes or errors)
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error("Not Found");
  res.status(404).json({
    message: error.message,
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ************************************************************************** \\
// Start HTTP Server
const httpPort = process.env.HTTP_PORT || 3000;
app.listen(httpPort, () => {
  console.log(`HTTP server running on ${httpPort}`);
});

// ************************************************************************** \\
// Start HTTPS Server
const httpsServer = https.createServer(credentials, app);
const httpsPort = process.env.HTTPS_PORT || 8443;

httpsServer.listen(httpsPort, () => {
  console.log(`HTTPS Server running on https://localhost:${httpsPort}`);
});
