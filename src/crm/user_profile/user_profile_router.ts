import { Router } from "express";
import user_profile_controller from "./user_profile_controller";
import token_actions from "../../lib/sec/jwt";

const router = Router();

// Route to update user information
router.put(
  "/",
  token_actions.authenticateTokenRouteCheck("access"),
  user_profile_controller.update_user_profile
);

// Route to update user information
router.get("/", user_profile_controller.get_user_profile);

router.post(
  "/",
  token_actions.authenticateTokenRouteCheck("access"),
  user_profile_controller.create_user_profile
);

export default router;
