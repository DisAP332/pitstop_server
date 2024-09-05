import express, { Request, Response } from "express";
import UserProfile from "./user_profile_model";
import User from "../user_model";
import { JwtPayload } from "jsonwebtoken";

function isAuthenticated(req: Request): req is Request & { user: JwtPayload } {
  return req.user !== undefined;
}

const get_user_profile = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const userProfile = await UserProfile.findOne({
      where: { userId },
      include: [{ model: User, as: "user", attributes: ["username", "email"] }],
    });

    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      success: true,
      message: "successfully acquired profile data",
      data: userProfile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching the profile" });
  }
};

const update_user_profile = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { bio, location, websiteUrl, amazonWishlist } = req.body;

    const userProfile = await UserProfile.findOne({ where: { userId } });

    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    userProfile.bio = bio || userProfile.bio;
    userProfile.location = location || userProfile.location;
    userProfile.websiteUrl = websiteUrl || userProfile.websiteUrl;
    userProfile.amazonWishlist = amazonWishlist || userProfile.amazonWishlist;

    await userProfile.save();

    res.json(userProfile);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the profile" });
  }
};

const create_user_profile = async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { bio, location, websiteUrl, amazonWishlist } = req.body;

    // Check if a profile already exists for the user
    const existingProfile = await UserProfile.findOne({ where: { userId } });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    // Create a new user profile
    const userProfile = await UserProfile.create({
      userId,
      bio,
      location,
      websiteUrl,
      amazonWishlist,
    });

    // Optionally include user information in the response
    const userProfileWithUser = await UserProfile.findOne({
      where: { id: userProfile.id },
      include: [{ model: User, as: "user", attributes: ["username", "email"] }],
    });

    res.status(201).json(userProfileWithUser);
  } catch (error) {
    console.error("Error creating profile:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the profile" });
  }
};

const user_profile_controller = {
  get_user_profile,
  update_user_profile,
  create_user_profile,
};

export default user_profile_controller;
