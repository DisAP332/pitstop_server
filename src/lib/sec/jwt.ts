import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utility/response";

const JWT_SECRET_ACCESS = process.env.ACCESS_JWT_SECRET;
const JWT_SECRET_REFRESH = process.env.REFRESH_JWT_SECRET;

// ********************************* extraction ************************************ //

// Utility function to extract userId from either an access or refresh token
const extractUserIdAndRoleFromJWT = (
  decodedToken: JwtPayload | string
): { userId: number | null; role: string | null } => {
  // Initialize userId and role as null
  let userId: number | null = null;
  let role: string | null = null;

  // Check if the decoded token is an object
  if (typeof decodedToken === "object") {
    // Extract userId if it exists in the token
    if ("userId" in decodedToken) {
      userId = decodedToken.userId as number;
    }

    // Extract role if it exists in the token
    if ("role" in decodedToken) {
      role = decodedToken.role as string;
    }
  }

  // Return both userId and role
  return { userId, role };
};

// ********************************* jwt issueing ************************************ //

const JWT_EXPIRATION_ACCESS = "1h"; // Access token expires in 1 hour
const JWT_EXPIRATION_REFRESH = "7d"; // Refresh token expires in 7 days

const issueJWT = (
  userId: number,
  type: "access" | "refresh",
  role: string
): string => {
  // step 1: Structure the payload
  const payload = { userId, role };

  // step 2: Select the correct secret and expiration time based on token type
  const secret = type === "access" ? JWT_SECRET_ACCESS : JWT_SECRET_REFRESH;
  const expiration =
    type === "access" ? JWT_EXPIRATION_ACCESS : JWT_EXPIRATION_REFRESH;

  if (!secret) {
    console.log("secret has not been set right");
    return "error";
  }

  // step 3: Sign and issue the token
  const token = jwt.sign(payload, secret, {
    expiresIn: expiration, // Token expiration based on type
  });

  return token;
};

// ********************************* token extraction methods ************************************ //

const getAccessTokenFromHeaders = (req: Request): string | null => {
  // step 1: Get the authorization header containing the access token

  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error(
      "Access token is missing or incorrectly formatted in the Authorization header."
    );
    return null;
  }

  // step 2: Extract the token (Assuming Bearer scheme)
  const accessToken = authHeader.split(" ")[1];
  console.log("Received Access Token:", accessToken); // Add this for debugging

  return accessToken || null;
};

const getRefreshTokenFromCookies = (req: Request): string | null => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    console.error("Refresh token is missing in cookies.");
    return null;
  }
  console.log("Received Refresh Token:", refreshToken); // Add this for debugging

  return refreshToken;
};
// ********************************* jwt authenticating ************************************ //

const doesUserIDMatch = (req: Request, userIdFromJWT: number): boolean => {
  // step 1: Extract the userId from the request params or body
  const userIdFromRequest = Number(req.params.userId || req.body.userId);

  console.log(userIdFromRequest, userIdFromJWT);

  // step 2: Compare the userId from the request and the JWT returning a boolean
  return userIdFromRequest === userIdFromJWT;
};

const authenticateToken = (type: "access" | "refresh", token: string) => {
  try {
    //verify the token is valid, using whatever secret is valid for the type

    // step 1: Determine which secret to use based on the token type
    const secret = type === "access" ? JWT_SECRET_ACCESS : JWT_SECRET_REFRESH;

    // step 2: Verify and decode the token
    const decodedToken = jwt.verify(token, secret!) as JwtPayload;

    return { decodedToken, expired: false, valid: true };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      // Token is expired, handle explicitly
      console.error("Token has expired:", error);
      return { decodedToken: null, expired: true, valid: false };
    } else {
      // Other errors (e.g., invalid token)
      console.error("JWT verification failed:", error);
      return { decodedToken: null, expired: false, valid: false };
    }
  }
};

const authenticateTokenRouteCheck = (type: "access" | "refresh") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Step 1: Extract token from request based on type
      const token =
        type === "access"
          ? getAccessTokenFromHeaders(req)
          : getRefreshTokenFromCookies(req);
      console.log("Received Token:", token); // Add this for debugging
      if (!token) {
        return sendResponse(res, 401, false, "No token provided");
      }

      console.log(JWT_SECRET_ACCESS, JWT_SECRET_REFRESH);

      // Step 2: Verify the token and check for expiration
      const { decodedToken, expired, valid } = authenticateToken(type, token);
      console.log("Authenticated Token:", decodedToken); // Add this for debugging

      if (!valid) {
        if (expired) {
          // Token has expired
          return sendResponse(res, 401, false, "Token has expired");
        }
        // Invalid token
        return sendResponse(res, 403, false, "Invalid token");
      }

      // Step 3: Extract userId and role from the token
      const { userId, role } = extractUserIdAndRoleFromJWT(decodedToken!);
      if (!userId || !role) {
        return sendResponse(res, 403, false, "Invalid or expired token");
      }

      console.log("Extracted User ID:", userId, "Role:", role); // Add this for debugging

      // Step 4: Ensure the userId matches the expected value (if applicable)
      const verified = doesUserIDMatch(req, userId);
      if (!verified) {
        return sendResponse(res, 403, false, "User ID mismatch");
      }

      // Attach the verification status, userId, and role to the request object
      req.isVerified = verified;
      req.userId = userId;
      req.role = role;

      // Call next middleware
      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return sendResponse(res, 403, false, "Invalid or expired token");
    }
  };
};

// ********************************* access jwt refreshing ************************************ //

// Function to refresh an access token using a refresh token
const refreshAccessToken = (req: Request, res: Response) => {
  try {
    // Step 1: Ensure that the userId and role are available from the middleware
    const { userId, role } = req;

    if (!userId || !role) {
      return sendResponse(res, 403, false, "Missing user information");
    }

    // Step 2: Issue a new access token using the extracted userId and role
    const newAccessToken = issueJWT(userId, "access", role);

    // Step 3: Send the new access token back to the client in a consistent format
    return sendResponse(res, 200, true, "Access token refreshed successfully", {
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    return sendResponse(
      res,
      500,
      false,
      "Server error while refreshing access token"
    );
  }
};

const token_actions = {
  refreshAccessToken,
  authenticateToken,
  authenticateTokenRouteCheck,
  issueJWT,
};

export default token_actions;
