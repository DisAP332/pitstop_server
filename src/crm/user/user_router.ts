import express from "express";
import user_controller from "./user_controller";
import token_actions from "../../lib/sec/jwt";

const router = express.Router();

router.post("/sign_up", user_controller.create_user);
router.post("/log_in", user_controller.login_user);
router.post(
  "/refresh_the_access_token",
  token_actions.authenticateTokenRouteCheck("refresh"),
  token_actions.refreshAccessToken
);
router.post("/logout", user_controller.logout_user);
router.get("/user_info", user_controller.get_user_data);

export default router;
