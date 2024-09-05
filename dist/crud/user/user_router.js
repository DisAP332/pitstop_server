"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = __importDefault(require("./user_controller"));
const auth_1 = __importDefault(require("../../lib/sec/auth"));
const router = express_1.default.Router();
router.post("/sign_up", user_controller_1.default.create_user);
router.post("/log_in", user_controller_1.default.login_user);
router.post("/refresh_the_access_token", auth_1.default.refresh_access_token);
router.post("/logout", user_controller_1.default.logout_user);
router.get("/user_info", user_controller_1.default.get_user_data);
exports.default = router;
