import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import User from "../../crm/user/user_model";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import user_controller from "../../crm/user/user_controller";

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
};

export default auth;
