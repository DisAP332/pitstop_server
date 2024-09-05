import passport from "passport";
import auth from "../../lib/sec/auth";
import User from "./user_model";
import { Response, Request } from "express";

interface CreateUserRequestBody {
  username: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

const create_user = async (
  req: Request<{}, {}, CreateUserRequestBody>,
  res: Response
) => {
  try {
    // Destructure data from the request body
    const { username, email, password, firstname, lastname } = req.body;

    console.log(req.body);

    // Validate that all required fields are present
    if (!username || !email || !password || !firstname || !lastname) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const hashedPassword = await auth.hash_password(password);

    // Create a new user in the database
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      firstname,
      lastname,
    });

    // create new token for the new user

    const token = auth.issue_jwt(newUser);

    // set http onnly cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // expires about 7 days
    });

    // Respond with the created user
    return res.status(201).json({ user: newUser, success: true });
  } catch (error) {
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", success: false });
  }
};

// Function to find a user by username
const find_user_by_username = async (
  username: string
): Promise<User | null> => {
  return User.findOne({
    where: { username },
  });
};

// Function to get user data
async function get_user_data(req: Request, res: Response) {
  const { username } = req.query;

  if (!username || typeof username !== "string") {
    return res
      .status(400)
      .json({ error: "Username is required and must be a string" });
  }

  try {
    const user = await find_user_by_username(username);
    if (user) {
      console.log(`Found user: ${user.username}`);
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      });
    } else {
      console.log("User not found.");
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching user data" });
  }
}

// loginUser function
const login_user = (req: Request, res: Response) => {
  passport.authenticate(
    "local",
    { session: false },
    (err: Error | null, user: User | false, info: { message: string }) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Internal server error",
          error: err,
        });
      }
      if (!user) {
        return res.status(401).json({ success: false, message: info.message });
      }

      const accessToken = auth.issue_jwt(user as User);
      const refreshToken = auth.issue_jwt(user as User);

      // set http onnly cookies
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true, // Use secure in production
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // expires about 7d
        path: "/",
      });

      return res.json({
        success: true,
        accessToken,
      });
    }
  )(req, res);
};

//logout user function.

const logout_user = (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.json({ success: true, message: "Logged out successfully" });
};

const user_controller = {
  create_user,
  find_user_by_username,
  get_user_data,
  login_user,
  logout_user,
};

export default user_controller;
