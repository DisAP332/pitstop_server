"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_profile_model_1 = __importDefault(require("./user_profile_model"));
const user_model_1 = __importDefault(require("../user_model"));
function isAuthenticated(req) {
    return req.user !== undefined;
}
const get_user_profile = async (req, res) => {
    try {
        if (!isAuthenticated(req)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.id;
        const userProfile = await user_profile_model_1.default.findOne({
            where: { userId },
            include: [{ model: user_model_1.default, as: "user", attributes: ["username", "email"] }],
        });
        if (!userProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.json({
            success: true,
            message: "successfully acquired profile data",
            data: userProfile,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "An error occurred while fetching the profile" });
    }
};
const update_user_profile = async (req, res) => {
    try {
        if (!isAuthenticated(req)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.id;
        const { bio, location, websiteUrl, amazonWishlist } = req.body;
        const userProfile = await user_profile_model_1.default.findOne({ where: { userId } });
        if (!userProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        userProfile.bio = bio || userProfile.bio;
        userProfile.location = location || userProfile.location;
        userProfile.websiteUrl = websiteUrl || userProfile.websiteUrl;
        userProfile.amazonWishlist = amazonWishlist || userProfile.amazonWishlist;
        await userProfile.save();
        res.json(userProfile);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "An error occurred while updating the profile" });
    }
};
const create_user_profile = async (req, res) => {
    try {
        // Check if the user is authenticated
        if (!isAuthenticated(req)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.id;
        const { bio, location, websiteUrl, amazonWishlist } = req.body;
        // Check if a profile already exists for the user
        const existingProfile = await user_profile_model_1.default.findOne({ where: { userId } });
        if (existingProfile) {
            return res.status(400).json({ message: "Profile already exists" });
        }
        // Create a new user profile
        const userProfile = await user_profile_model_1.default.create({
            userId,
            bio,
            location,
            websiteUrl,
            amazonWishlist,
        });
        // Optionally include user information in the response
        const userProfileWithUser = await user_profile_model_1.default.findOne({
            where: { id: userProfile.id },
            include: [{ model: user_model_1.default, as: "user", attributes: ["username", "email"] }],
        });
        res.status(201).json(userProfileWithUser);
    }
    catch (error) {
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
exports.default = user_profile_controller;
