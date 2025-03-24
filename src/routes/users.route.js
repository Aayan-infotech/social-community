import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { updateProfileSchema } from "../validators/userValidator.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";


const router = Router();

router.get("/get-profile", verifyJWT, getUserProfile);
router.post(
  "/update-profile",
  verifyJWT,
  validateRequest(updateProfileSchema),
  upload.fields([
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),
  errorHandler,
  updateUserProfile
);

export default router;
