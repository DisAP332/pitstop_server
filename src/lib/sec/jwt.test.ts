import dotenv from "dotenv";
dotenv.config(); // This will load your .env variables
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import token_actions from "./jwt"; // Import the middleware and JWT utility functions
import { sendResponse } from "../utility/response";

// Mock JWT secrets and expiration times
const JWT_SECRET_ACCESS = process.env.ACCESS_JWT_SECRET;
const JWT_SECRET_REFRESH = process.env.REFRESH_JWT_SECRET;

// Mock data
const mockUserId = 1;
const mockRole = "user";

// Create an Express app
const app = express();
app.use(express.json());
app.use(cookieParser());

// Protected route using the middleware and sendResponse for responses
app.get(
  "/protected-route/:userId",
  token_actions.authenticateTokenRouteCheck("access"),
  (req, res) => {
    sendResponse(res, 200, true, "Authenticated successfully", {
      userId: req.userId,
      role: req.role,
    });
  }
);

// Refresh token endpoint for testing refresh functionality
app.post(
  "/refresh-token",
  token_actions.authenticateTokenRouteCheck("refresh"),
  (req, res) => {
    // If valid, issue a new access token
    const newAccessToken = token_actions.issueJWT(
      req.userId!,
      "access",
      req.role!
    );
    sendResponse(res, 200, true, "New access token issued", {
      accessToken: newAccessToken,
    });
  }
);

// Middleware tests for both access and refresh tokens
describe("authenticateTokenRouteCheck Middleware (Access & Refresh Tokens)", () => {
  let accessToken: string;
  let refreshToken: string;
  let expiredAccessToken: string;
  let expiredRefreshToken: string;
  let invalidToken: string;

  beforeAll(() => {
    dotenv.config();
    // Generate a valid access token
    accessToken = token_actions.issueJWT(mockUserId, "access", mockRole);

    // Generate a valid refresh token
    refreshToken = token_actions.issueJWT(mockUserId, "refresh", mockRole);

    // Generate an expired access token
    expiredAccessToken = jwt.sign(
      { userId: mockUserId, role: mockRole },
      JWT_SECRET_ACCESS!,
      { expiresIn: "-1s" } // Already expired
    );

    // Generate an expired refresh token
    expiredRefreshToken = jwt.sign(
      { userId: mockUserId, role: mockRole },
      JWT_SECRET_REFRESH!,
      { expiresIn: "-1s" } // Already expired
    );

    // Generate an invalid token (wrong secret)
    invalidToken = jwt.sign(
      { userId: mockUserId, role: mockRole },
      "wrong-secret",
      {
        expiresIn: "1h",
      }
    );
  });

  it("should authenticate a user with a valid access token", async () => {
    const res = await request(app)
      .get(`/protected-route/${mockUserId}`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ userId: mockUserId });
    console.log(res.body);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Authenticated successfully");
    expect(res.body.payload.userId).toBe(mockUserId);
    expect(res.body.payload.role).toBe(mockRole);
  });

  it("should return 401 for an expired access token", async () => {
    const res = await request(app)
      .get(`/protected-route/${mockUserId}`)
      .set("authorization", `Bearer ${expiredAccessToken}`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Token has expired");
  });

  it("should return 403 for an invalid access token", async () => {
    const res = await request(app)
      .get(`/protected-route/${mockUserId}`)
      .set("authorization", `Bearer ${invalidToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid token");
  });

  it("should return 403 if userId in the access token does not match the request params", async () => {
    const differentUserIdToken = token_actions.issueJWT(
      999,
      "access",
      mockRole
    ); // userId = 999

    const res = await request(app)
      .get(`/protected-route/${mockUserId}`) // mockUserId = 1, but token userId = 999
      .set("authorization", `Bearer ${differentUserIdToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User ID mismatch");
  });

  it("should return 401 if no access token is provided", async () => {
    const res = await request(app).get(`/protected-route/${mockUserId}`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("No token provided");
  });

  it("should authenticate a user with a valid refresh token and issue a new access token", async () => {
    const res = await request(app)
      .post("/refresh-token")
      .set("Cookie", `refreshToken=${refreshToken}`)
      .send({ userId: mockUserId });
    console.log(res.body); // user id mismatch

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("New access token issued");
    expect(res.body.payload.accessToken).toBeTruthy();
  });

  it("should return 401 for an expired refresh token", async () => {
    const res = await request(app)
      .post("/refresh-token")
      .set("Cookie", `refreshToken=${expiredRefreshToken}`);

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Token has expired");
  });

  it("should return 403 for an invalid refresh token", async () => {
    const res = await request(app)
      .post("/refresh-token")
      .set("Cookie", `refreshToken=${invalidToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid token");
  });

  it("should return 403 if userId in the refresh token does not match the request params", async () => {
    const differentUserIdToken = token_actions.issueJWT(
      999,
      "refresh",
      mockRole
    ); // userId = 999

    const res = await request(app)
      .post("/refresh-token")
      .set("Cookie", `refreshToken=${differentUserIdToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User ID mismatch");
  });

  it("should return 401 if no refresh token is provided", async () => {
    const res = await request(app).post("/refresh-token");

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("No token provided");
  });
});
