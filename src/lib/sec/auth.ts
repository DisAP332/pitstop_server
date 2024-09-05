import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import User from "../../crud/user/user_model";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import user_controller from "../../crud/user/user_controller";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// ***************************************************************************************** //
// begin hashing section of auth

// Define the number of salt rounds for server-side hashing

// Convert the environment variable to a number
const SERVER_SALT_ROUNDS: number = parseInt(process.env.HASH_SALT!, 10);

if (isNaN(SERVER_SALT_ROUNDS)) {
  throw new Error("Environment variable HASH_SALT must be a valid number");
}

/**
 * Hash a client-side hashed password with a new salt.
 * @param clientHashedPassword - The password that has already been hashed on the client side.
 * @returns The new server-side hashed password.
 */
async function hash_password(clientHashedPassword: string): Promise<string> {
  try {
    // Generate a new salt on the server
    const serverSalt = await bcrypt.genSalt(SERVER_SALT_ROUNDS);

    // Hash the client-side hashed password with the server salt
    const finalServerHashedPassword = await bcrypt.hash(
      clientHashedPassword,
      serverSalt
    );

    return finalServerHashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Internal server error");
  }
}

// ************************************************************************** \\
// begin password verification via passport section

// Helper functions

const verify_password = async (
  user: User,
  clientpwd: string
): Promise<boolean> => {
  console.log("identifier", user.password);
  console.log("clientpwd", clientpwd);
  return bcrypt.compare(clientpwd, user.password);
};
// End helper functions

// Begin passport Local Strategy
passport.use(
  new LocalStrategy(async (username, clientpwd, done) => {
    try {
      const user = await user_controller.find_user_by_username(username);
      console.log(user);

      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      const isValid = await verify_password(user, clientpwd);
      if (!isValid) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);
// End passport Local Strategy

// ********************************************************************* //
// being JWT section

// JWT issuing function
const issue_jwt = (user: User): { token: string; expires: string } => {
  const _id = user.id;
  const expiresIn = "15m";

  const payload = {
    sub: _id,
    iat: Date.now(),
  };

  const signedToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });

  console.log(`A JWT was issued to: ${user.id}`);

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn,
  };
};

// refresh token

const refresh_access_token = (req: Request, res: Response) => {
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

  jwt.verify(
    refreshToken,
    process.env.JWT_SECRET!,
    (err: jwt.VerifyErrors | null, decoded: any) => {
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
    }
  );
};

// verify JWT

const authenticate_token = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1]; // Bearer Token

  if (token == null) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token

    req.user = user;
    next();
  });
};

// end password verification via passport section
// ************************************************************************** \\

// rate limiter to prevent brute force attacks.

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});

const auth = {
  hash_password,
  limiter,
  issue_jwt,
  authenticate_token,
  refresh_access_token,
};

export default auth;
