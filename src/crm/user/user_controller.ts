import passport from "passport";
import auth from "../../lib/sec/auth";
import User from "./user_model";
import { Response, Request } from "express";
import { sendResponse } from "../../lib/utility/response";
import CRUD from "../../lib/crud/crud";
import token_actions from "../../lib/sec/jwt";

interface CreateUserRequestBody {
  username: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

// Function to find a user by username
const find_user_by_username = async (
  username: string
): Promise<User | null> => {
  return User.findOne({
    where: { username },
  });
};

const create_user = async (
  req: Request<{}, {}, CreateUserRequestBody>,
  res: Response
) => {
  try {
    const { username, email, password, firstname, lastname } = req.body;

    // Validate that all required fields are present
    if (!username || !email || !password || !firstname || !lastname) {
      return sendResponse(res, 400, false, "All fields are required.");
    }

    // step 1: Hash the password before creating the user
    req.body.password = await auth.hash_password(password);

    // step 2: Create the user and store within the database
    const newUser = await CRUD.createEntity(req, User, `user: ${username}`);

    if (newUser.success === false || !newUser.payload) {
      return sendResponse(res, 500, false, newUser.message);
    }

    // step 3: Issue a refresh token and access token with lowest privledges and the ID baked in
    const refreshToken = token_actions.issueJWT(
      newUser.payload.id,
      "refresh",
      "user"
    );
    const accessToken = token_actions.issueJWT(
      newUser.payload.id,
      "access",
      "user"
    );

    // step 4: Send the refresh token over http only cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // Use secure in production
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // Expires in about 7 days
      path: "/",
    });

    const id = newUser.payload?.id;

    // step 5: Send the response with the userData and the access token in the response body
    return sendResponse(res, 201, true, "User created successfully", {
      userData: {
        username,
        email,
        firstname,
        lastname,
        id,
      },
      accessToken: accessToken,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return sendResponse(res, 500, false, "Internal Server Error");
  }
};

async function get_user_data(req: Request, res: Response) {
  const { username, id } = req.body;

  // ensure correct typing and existence of username
  if (!username || typeof username !== "string") {
    return res
      .status(400)
      .json({ error: "Username is required and must be a string" });
  }

  try {
    // step 1: retrieve the user data from the database
    const user = await CRUD.readEntity(id, User, username);
    if (user.payload) {
      const payload = user.payload;
      console.log(`Found user: ${payload.username}`);

      // step 2: format the data to send back to the client via the response
      const data = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        firstname: payload.firstname,
        lastname: payload.lastname,
      };

      // step 3: Send the response
      return sendResponse(
        res,
        200,
        true,
        `Found user ${data.username}`,
        payload
      );
    } else {
      console.log("User not found.");
      return sendResponse(res, 404, false, "User not found");
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return sendResponse(
      res,
      500,
      false,
      "An error occured while fetching user data",
      error
    );
  }
}

// loginUser function
const login_user = (req: Request, res: Response) => {
  passport.authenticate(
    "local",
    { session: false },
    (err: Error | null, user: User | false, info: { message: string }) => {
      if (err) {
        return sendResponse(res, 500, false, "Internal server Error", err);
      }
      if (!user) {
        return sendResponse(res, 401, false, info.message);
      }

      // step 1: create the tokens for the successfully logged in user
      const accessToken = token_actions.issueJWT(user.id, "access", "user");
      const refreshToken = token_actions.issueJWT(user.id, "refresh", "user");

      // step 2: destructure the user data as we do not want to send back the password
      const { username, email, firstname, lastname, id } = user;

      // step 3: set the refresh token in http only cookies for security
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true, // Use secure in production
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // expires about 7d
        path: "/",
      });

      // step 4: send back the response with the user data and with the access token in the body
      return sendResponse(res, 200, true, "User successfully found", {
        accessToken: accessToken,
        userData: {
          username,
          email,
          firstname,
          lastname,
          id,
        },
      });
    }
  )(req, res);
};

const logout_user = (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return sendResponse(res, 200, true, "Logged out successfully");
};

const user_controller = {
  create_user,
  find_user_by_username,
  get_user_data,
  login_user,
  logout_user,
};

export default user_controller;
