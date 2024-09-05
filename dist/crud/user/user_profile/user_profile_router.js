"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../../../lib/sec/auth"));
const user_profile_controller_1 = __importDefault(require("./user_profile_controller"));
const router = (0, express_1.Router)();
// Route to update user information
router.put("/", auth_1.default.authenticate_token, user_profile_controller_1.default.update_user_profile);
// Route to update user information
router.get("/", user_profile_controller_1.default.get_user_profile);
router.post("/", auth_1.default.authenticate_token, user_profile_controller_1.default.create_user_profile);
exports.default = router;
