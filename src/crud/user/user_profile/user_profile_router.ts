import { Router } from "express";
import auth from "../../../lib/sec/auth";
import user_profile_controller from "./user_profile_controller";

const router = Router();

// Route to update user information
router.put(
  "/",
  auth.authenticate_token,
  user_profile_controller.update_user_profile
);

// Route to update user information
router.get("/", user_profile_controller.get_user_profile);

router.post(
  "/",
  auth.authenticate_token,
  user_profile_controller.create_user_profile
);

export default router;
