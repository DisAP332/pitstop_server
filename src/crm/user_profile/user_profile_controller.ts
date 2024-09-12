import express, { Request, Response } from "express";
import UserProfile from "./user_profile_model";
import User from "../user/user_model";
import { JwtPayload } from "jsonwebtoken";
import { sendResponse } from "../../lib/utility/response";
import CRUD from "../../lib/crud/crud";

function isAuthenticated(req: Request): req is Request & { user: JwtPayload } {
  return req.user !== undefined;
}

const get_user_profile = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticated(req)) {
      return sendResponse(res, 401, false, "Unauthorized");
    }

    const userId = req.user.id;
    const userProfile = await CRUD.readEntity(userId, UserProfile, "Profile", [
      { model: User, as: "user", attributes: ["username", "email"] },
    ]);

    if (userProfile.success === false) {
      return sendResponse(res, 404, false, userProfile.message);
    }

    sendResponse(res, 200, true, userProfile.message, userProfile);
  } catch (error) {
    return sendResponse(
      res,
      500,
      false,
      "An error occurred while fetching the profile"
    );
  }
};

const update_user_profile = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticated(req)) {
      return sendResponse(res, 401, false, "Unauthorized");
    }

    const userId = req.user.id;

    const updateResult = await CRUD.updateEntity(
      userId,
      req,
      UserProfile,
      "Profile"
    );

    if (!updateResult.success) {
      return sendResponse(res, 404, false, updateResult.message);
    }

    return sendResponse(res, 200, true, updateResult.message, updateResult);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return sendResponse(
      res,
      500,
      false,
      "An error occurred while updating the profile"
    );
  }
};

const create_user_profile = async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.body;

    // Check if a profile already exists for the user
    const existingProfile = await CRUD.readEntity(
      id,
      UserProfile,
      "Profile",
      undefined,
      "userId"
    );

    if (existingProfile.success === true) {
      return sendResponse(res, 400, false, "Profile for user already exists");
    }

    const result = await CRUD.createEntity(req, UserProfile, "Profile");

    if (!result.success) {
      return sendResponse(res, 500, false, result.message);
    }

    return sendResponse(res, 201, true, result.message, result.payload);
  } catch (error) {
    console.error("Error creating profile:", error);
    return sendResponse(
      res,
      500,
      false,
      "An error occured creating the user profile"
    );
  }
};

const user_profile_controller = {
  get_user_profile,
  update_user_profile,
  create_user_profile,
};

export default user_profile_controller;
